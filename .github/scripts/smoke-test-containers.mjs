import { execFileSync, spawnSync } from "node:child_process";
import { createServer } from "node:net";

const STARTUP_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 500;
const REQUEST_TIMEOUT_MS = 10_000;
const SMOKE_SESSION_SECRET =
  process.env.SMOKE_SESSION_SECRET ||
  "smoke-test-only-dummy-session-secret-min-32-chars";

/**
 * Reserve an available ephemeral localhost TCP port so backend CORS and
 * frontend port binding share the exact same origin.
 * @returns {Promise<number>}
 */
function allocateLocalPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to allocate local port")));
        return;
      }
      const { port } = address;
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve(port);
      });
    });
  });
}

/**
 * Execute a Docker CLI command and return trimmed stdout.
 * @param {string[]} args
 * @returns {string}
 */
function runDocker(args) {
  return execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Execute a Docker CLI command without throwing on failure.
 * @param {string[]} args
 * @returns {{ ok: boolean; stdout: string; stderr: string }}
 */
function tryRunDocker(args) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

/**
 * Sleep for a number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Poll a condition until it returns a truthy value or times out.
 * @template T
 * @param {string} label
 * @param {number} timeoutMs
 * @param {() => Promise<T | null | false | undefined>} checkFn
 * @returns {Promise<T>}
 */
async function waitFor(label, timeoutMs, checkFn) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const value = await checkFn();
      if (value) {
        return value;
      }
      lastError = null;
    } catch (error) {
      lastError = error;
    }
    await sleep(POLL_INTERVAL_MS);
  }

  const reason =
    lastError instanceof Error
      ? lastError.message
      : lastError
        ? String(lastError)
        : "condition returned falsy";
  throw new Error(
    `Timed out waiting for ${label} after ${String(timeoutMs)}ms: ${reason}`,
  );
}

/**
 * Verify a container is still running; throw immediately if it exited.
 * @param {string} containerName
 */
function assertContainerRunning(containerName) {
  const inspect = tryRunDocker([
    "inspect",
    "--format",
    "{{.State.Running}} {{.State.ExitCode}}",
    containerName,
  ]);
  if (!inspect.ok) {
    throw new Error(
      `Container ${containerName} does not exist: ${inspect.stderr}`,
    );
  }
  const [running, exitCode] = inspect.stdout.split(" ");
  if (running !== "true") {
    throw new Error(
      `Container ${containerName} exited unexpectedly with status ${exitCode ?? "unknown"}`,
    );
  }
}

/**
 * Resolve the host port bound to an exposed container port.
 * @param {string} containerName
 * @param {string} containerPort
 * @returns {number}
 */
function getMappedPort(containerName, containerPort) {
  const output = runDocker(["port", containerName, containerPort]);
  const firstLine = output.split(/\r?\n/)[0] ?? "";
  const match = /:(\d+)$/.exec(firstLine.trim());
  if (!match?.[1]) {
    throw new Error(
      `Could not parse mapped host port for ${containerName} (${containerPort}) from: ${output}`,
    );
  }
  return Number(match[1]);
}

/**
 * Fetch a URL with an explicit timeout.
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, init = {}) {
  return await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/**
 * Assert a condition and raise a clear Error if false.
 * @param {unknown} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Smoke assertion failed: ${message}`);
  }
}

/**
 * Print container logs for debugging smoke test failures.
 * @param {string[]} containerNames
 */
function dumpLogs(containerNames) {
  for (const name of containerNames) {
    const logs = tryRunDocker(["logs", "--tail", "200", name]);
    if (!logs.ok && !logs.stdout && !logs.stderr) {
      continue;
    }
    console.error(`\n===== docker logs ${name} =====`);
    if (logs.stdout) {
      console.error(logs.stdout);
    }
    if (logs.stderr) {
      console.error(logs.stderr);
    }
  }
}

const MOCK_EXTERNAL_SCRIPT = [
  'const http = require("node:http");',
  "const users = [",
  "  {",
  '    id: "recPM000000000001",',
  '    createdTime: "2026-01-01T00:00:00.000Z",',
  "    fields: {",
  '      Email: "pm@example.com",',
  '      Name: "Morgan Taylor",',
  '      Picture: "https://example.com/pm.png",',
  '      Role: "Project Manager",',
  '      "Calendar IDs": "primary",',
  '      Timezone: "America/Los_Angeles",',
  '      "Working Hours Start": "09:00",',
  '      "Working Hours End": "17:00",',
  '      "Off Days": ["Sunday", "Saturday"]',
  "    }",
  "  },",
  "  {",
  '    id: "recLing0000000001",',
  '    createdTime: "2026-01-01T00:00:00.000Z",',
  "    fields: {",
  '      Email: "linguist@example.com",',
  '      Name: "Alice Smoke",',
  '      Picture: "https://example.com/alice.png",',
  '      Role: "Linguist",',
  '      "Hourly Rate": 50,',
  '      Currency: "USD",',
  '      Languages: ["EN-FR"],',
  '      Specialization: ["Legal"],',
  "      Rating: 5,",
  '      Timezone: "America/Los_Angeles"',
  "    }",
  "  }",
  "];",
  "function filterRecords(formula) {",
  "  if (!formula) return users;",
  "  let result = users;",
  "  const lowerEmail = /LOWER\\(\\{Email\\}\\)\\s*=\\s*'([^']+)'/.exec(formula);",
  "  const exactEmail = /\\{Email\\}\\s*=\\s*'([^']+)'/.exec(formula);",
  "  const roleMatch = /\\{Role\\}\\s*=\\s*'([^']+)'/.exec(formula);",
  "  if (lowerEmail) {",
  "    const t = lowerEmail[1].toLowerCase();",
  '    result = result.filter((r) => String(r.fields.Email || "").toLowerCase() === t);',
  "  } else if (exactEmail) {",
  "    const t = exactEmail[1].toLowerCase();",
  '    result = result.filter((r) => String(r.fields.Email || "").toLowerCase() === t);',
  "  }",
  "  if (roleMatch) {",
  "    result = result.filter((r) => r.fields.Role === roleMatch[1]);",
  "  }",
  "  return result;",
  "}",
  "function sendJson(res, status, payload) {",
  '  res.writeHead(status, { "Content-Type": "application/json" });',
  "  res.end(JSON.stringify(payload));",
  "}",
  "const server = http.createServer((req, res) => {",
  '  const url = new URL(req.url || "/", "http://127.0.0.1:8080");',
  '  if (url.pathname === "/latest") {',
  "    return sendJson(res, 200, {",
  "      amount: 1,",
  '      base: "USD",',
  '      date: "2026-11-08",',
  "      rates: { EUR: 0.92, GBP: 0.79, CAD: 1.38 }",
  "    });",
  "  }",
  '  if (url.pathname.startsWith("/v0/appsmoketestbase/Users")) {',
  '    const formula = url.searchParams.get("filterByFormula") || "";',
  "    return sendJson(res, 200, { records: filterRecords(formula) });",
  "  }",
  '  if (url.pathname === "/v1/sys/health") {',
  "    return sendJson(res, 200, { initialized: true, sealed: false });",
  "  }",
  '  if (url.pathname.startsWith("/v1/")) {',
  "    return sendJson(res, 404, { errors: [] });",
  "  }",
  '  return sendJson(res, 200, { status: "ok" });',
  "});",
  'server.listen(8080, "0.0.0.0", () => {',
  '  console.log("mock-external listening on 8080");',
  "});",
].join("\n");

async function main() {
  const backendImage = process.env.BACKEND_IMAGE_REF?.trim();
  const frontendImage = process.env.FRONTEND_IMAGE_REF?.trim();
  const shouldPull = process.env.SMOKE_PULL_IMAGES === "true";
  const runPlaywrightSmoke = process.env.RUN_PLAYWRIGHT_SMOKE === "true";

  if (!backendImage || !frontendImage) {
    throw new Error(
      "BACKEND_IMAGE_REF and FRONTEND_IMAGE_REF environment variables are required.",
    );
  }

  const reservedFrontendPort = await allocateLocalPort();
  const expectedCorsOrigin = `http://127.0.0.1:${String(reservedFrontendPort)}`;

  const runId = `${String(process.pid)}-${String(Date.now())}`;
  const networkName = `linguistnow-smoke-${runId}`;
  const redisName = `linguistnow-smoke-redis-${runId}`;
  const mockName = `linguistnow-smoke-mock-${runId}`;
  const backendName = `linguistnow-smoke-backend-${runId}`;
  const frontendName = `linguistnow-smoke-frontend-${runId}`;
  const startedContainers = [];

  try {
    if (shouldPull) {
      console.log(`Pulling backend image: ${backendImage}`);
      runDocker(["pull", backendImage]);
      console.log(`Pulling frontend image: ${frontendImage}`);
      runDocker(["pull", frontendImage]);
    } else {
      console.log(`Using local backend image: ${backendImage}`);
      console.log(`Using local frontend image: ${frontendImage}`);
    }

    console.log(`Creating isolated Docker network: ${networkName}`);
    runDocker(["network", "create", networkName]);

    console.log("Starting Redis container...");
    runDocker([
      "run",
      "-d",
      "--name",
      redisName,
      "--network",
      networkName,
      "--network-alias",
      "redis",
      "redis:7-alpine",
    ]);
    startedContainers.push(redisName);

    await waitFor("Redis readiness", STARTUP_TIMEOUT_MS, async () => {
      assertContainerRunning(redisName);
      const ping = tryRunDocker(["exec", redisName, "redis-cli", "ping"]);
      return ping.ok && ping.stdout === "PONG";
    });

    console.log("Starting mock external HTTP server...");
    runDocker([
      "run",
      "-d",
      "--name",
      mockName,
      "--network",
      networkName,
      "--network-alias",
      "mock-external",
      "node:22-alpine",
      "node",
      "-e",
      MOCK_EXTERNAL_SCRIPT,
    ]);
    startedContainers.push(mockName);

    await waitFor(
      "mock external server readiness",
      STARTUP_TIMEOUT_MS,
      async () => {
        assertContainerRunning(mockName);
        const probe = tryRunDocker([
          "exec",
          mockName,
          "node",
          "-e",
          'Promise.all([fetch("http://127.0.0.1:8080/latest?base=USD"),fetch("http://127.0.0.1:8080/v0/appsmoketestbase/Users")]).then((rs) => process.exit(rs.every((r) => r.ok) ? 0 : 1)).catch(() => process.exit(1))',
        ]);
        return probe.ok;
      },
    );

    console.log("Starting backend container...");
    runDocker([
      "run",
      "-d",
      "--name",
      backendName,
      "--network",
      networkName,
      "--network-alias",
      "backend",
      "-p",
      "127.0.0.1::5000",
      "-e",
      "PORT=5000",
      "-e",
      "NODE_ENV=production",
      "-e",
      `FRONTEND_URL=${expectedCorsOrigin}`,
      "-e",
      "BACKEND_URL=http://127.0.0.1:5050",
      "-e",
      "GOOGLE_CLIENT_ID=smoke-test-google-client-id",
      "-e",
      "GOOGLE_CLIENT_SECRET=smoke-test-google-client-secret",
      "-e",
      "AIRTABLE_BASE_ID=appsmoketestbase",
      "-e",
      "AIRTABLE_PERSONAL_ACCESS_TOKEN=patsmoketesttoken",
      "-e",
      "AIRTABLE_ENDPOINT_URL=http://mock-external:8080",
      "-e",
      "VAULT_ADDR=http://mock-external:8080",
      "-e",
      "REDIS_URL=redis://redis:6379",
      "-e",
      "FRANKFURTER_URL=http://mock-external:8080",
      "-e",
      "FRANKFURTER_FALLBACK_URL=disabled",
      "-e",
      `SESSION_SECRET=${SMOKE_SESSION_SECRET}`,
      backendImage,
    ]);
    startedContainers.push(backendName);

    const backendPort = getMappedPort(backendName, "5000/tcp");
    const backendUrl = `http://127.0.0.1:${String(backendPort)}`;

    console.log(`Waiting for backend /api/health on ${backendUrl}...`);
    const healthJson = await waitFor(
      "backend /api/health",
      STARTUP_TIMEOUT_MS,
      async () => {
        assertContainerRunning(backendName);
        const res = await fetchWithTimeout(`${backendUrl}/api/health`);
        if (res.status !== 200) {
          return null;
        }
        const data = await res.json();
        return data?.status === "healthy" ? data : null;
      },
    );
    assert(
      typeof healthJson.version === "string" && healthJson.version.length > 0,
      "health version must be present",
    );
    console.log(`Backend healthy (version=${String(healthJson.version)})`);

    console.log("Checking backend CORS headers...");
    const corsRes = await fetchWithTimeout(`${backendUrl}/api/health`, {
      headers: { Origin: expectedCorsOrigin },
    });
    assert(
      corsRes.status === 200,
      `CORS check returned ${String(corsRes.status)}`,
    );
    assert(
      corsRes.headers.get("access-control-allow-origin") === expectedCorsOrigin,
      `Expected Access-Control-Allow-Origin=${expectedCorsOrigin}, got ${String(corsRes.headers.get("access-control-allow-origin"))}`,
    );

    console.log("Checking backend OpenAPI spec (/api-docs.json)...");
    const swaggerRes = await fetchWithTimeout(`${backendUrl}/api-docs.json`);
    assert(
      swaggerRes.status === 200,
      `/api-docs.json returned ${String(swaggerRes.status)}`,
    );
    const swaggerJson = await swaggerRes.json();
    assert(swaggerJson?.openapi === "3.0.0", "OpenAPI version should be 3.0.0");
    assert(
      Boolean(swaggerJson?.paths?.["/api/health"]),
      "OpenAPI paths should include /api/health",
    );

    console.log("Checking backend FX rates (/api/currency/rates)...");
    const ratesRes = await fetchWithTimeout(`${backendUrl}/api/currency/rates`);
    assert(
      ratesRes.status === 200,
      `/api/currency/rates returned ${String(ratesRes.status)}`,
    );
    const ratesJson = await ratesRes.json();
    assert(
      ratesJson?.base === "USD",
      `Expected rates base USD, got ${String(ratesJson?.base)}`,
    );
    assert(
      ratesJson?.rates?.EUR === 0.92,
      `Expected EUR rate 0.92, got ${String(ratesJson?.rates?.EUR)}`,
    );

    console.log("Checking backend FX conversion (/api/currency/convert)...");
    const convertRes = await fetchWithTimeout(
      `${backendUrl}/api/currency/convert?amount=100&from=USD&to=EUR`,
    );
    assert(
      convertRes.status === 200,
      `/api/currency/convert returned ${String(convertRes.status)}`,
    );
    const convertJson = await convertRes.json();
    assert(
      convertJson?.converted === 92,
      `Expected converted 92, got ${String(convertJson?.converted)}`,
    );

    console.log(
      "Checking protected route rejects unauthenticated access (/api/users/:id)...",
    );
    const unauthRes = await fetchWithTimeout(
      `${backendUrl}/api/users/smoke@example.com`,
    );
    assert(
      unauthRes.status === 401,
      `Expected unauthenticated /api/users/smoke@example.com to return 401, got ${String(unauthRes.status)}`,
    );

    console.log("Starting frontend container...");
    runDocker([
      "run",
      "-d",
      "--name",
      frontendName,
      "--network",
      networkName,
      "--network-alias",
      "frontend",
      "-p",
      `127.0.0.1:${String(reservedFrontendPort)}:80`,
      frontendImage,
    ]);
    startedContainers.push(frontendName);

    const frontendPort = getMappedPort(frontendName, "80/tcp");
    const frontendUrl = `http://127.0.0.1:${String(frontendPort)}`;

    console.log(`Waiting for frontend /health on ${frontendUrl}...`);
    await waitFor("frontend /health", STARTUP_TIMEOUT_MS, async () => {
      assertContainerRunning(frontendName);
      const res = await fetchWithTimeout(`${frontendUrl}/health`);
      if (res.status !== 200) {
        return false;
      }
      const text = (await res.text()).trim();
      return text === "healthy";
    });

    console.log("Checking frontend index HTML and static bundle...");
    const indexRes = await fetchWithTimeout(`${frontendUrl}/`);
    assert(
      indexRes.status === 200,
      `Frontend / returned ${String(indexRes.status)}`,
    );
    const indexContentType = indexRes.headers.get("content-type") ?? "";
    assert(
      indexContentType.includes("text/html"),
      `Unexpected / content-type: ${indexContentType}`,
    );
    const indexHtml = await indexRes.text();
    assert(
      indexHtml.includes('<div id="root"'),
      'Frontend HTML missing <div id="root">',
    );

    const scriptMatch = /src="(\/assets\/[^"]+\.js)"/.exec(indexHtml);
    assert(
      Boolean(scriptMatch?.[1]),
      "Frontend HTML missing built /assets/*.js script tag",
    );
    const assetRes = await fetchWithTimeout(`${frontendUrl}${scriptMatch[1]}`);
    assert(
      assetRes.status === 200,
      `Asset ${scriptMatch[1]} returned ${String(assetRes.status)}`,
    );
    const assetCacheControl = assetRes.headers.get("cache-control") ?? "";
    assert(
      assetCacheControl.includes("immutable"),
      `Expected immutable Cache-Control for built asset, got ${assetCacheControl}`,
    );

    console.log("Checking frontend SPA route fallback (/dashboard)...");
    const spaRes = await fetchWithTimeout(`${frontendUrl}/dashboard`);
    assert(
      spaRes.status === 200,
      `Frontend /dashboard returned ${String(spaRes.status)}`,
    );
    const spaHtml = await spaRes.text();
    assert(
      spaHtml.includes('<div id="root"'),
      'SPA fallback HTML missing <div id="root">',
    );

    console.log("Checking PWA manifest (/manifest.webmanifest)...");
    const manifestRes = await fetchWithTimeout(
      `${frontendUrl}/manifest.webmanifest`,
    );
    assert(
      manifestRes.status === 200,
      `/manifest.webmanifest returned ${String(manifestRes.status)}`,
    );
    const manifestJson = await manifestRes.json();
    assert(
      manifestJson?.short_name === "LinguistNow",
      `Expected manifest short_name LinguistNow, got ${String(manifestJson?.short_name)}`,
    );

    console.log("All HTTP container smoke checks passed!");

    if (runPlaywrightSmoke) {
      console.log(
        "Running Tier B Playwright @smoke suite against live containers...",
      );
      const isWin = process.platform === "win32";
      const runner = isWin ? process.env.ComSpec || "cmd.exe" : "pnpm";
      const args = isWin
        ? ["/d", "/c", "pnpm.cmd", "--filter", "@linguistnow/e2e", "test:smoke"]
        : ["--filter", "@linguistnow/e2e", "test:smoke"];
      execFileSync(runner, args, {
        env: {
          ...process.env,
          SMOKE_FRONTEND_URL: frontendUrl,
          SMOKE_BACKEND_URL: backendUrl,
          SMOKE_SESSION_SECRET,
        },
        stdio: "inherit",
      });
      console.log("Tier B Playwright @smoke suite passed!");
    }
  } catch (error) {
    console.error("Container smoke test failed:", error);
    dumpLogs(startedContainers);
    process.exitCode = 1;
  } finally {
    if (startedContainers.length > 0) {
      tryRunDocker(["rm", "-f", ...startedContainers]);
    }
    tryRunDocker(["network", "rm", networkName]);
  }
}

await main();
