import { execFileSync, spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");
const isWin = process.platform === "win32";
const runner = isWin ? process.env.ComSpec || "cmd.exe" : "pnpm";
const pnpmArgs = (args) => (isWin ? ["/d", "/c", "pnpm.cmd", ...args] : args);

const clientEnv = {
  ...process.env,
  VITE_API_URL: process.env.VITE_API_URL || "http://127.0.0.1:5050",
  VITE_BASE_URL: process.env.VITE_BASE_URL || "http://127.0.0.1:4173",
  VITE_GOOGLE_CLIENT_ID:
    process.env.VITE_GOOGLE_CLIENT_ID || "e2e-google-client-id",
};

if (process.env.E2E_SKIP_CLIENT_BUILD !== "1") {
  execFileSync(
    runner,
    pnpmArgs(["--filter", "./shared", "--fail-if-no-match", "build"]),
    {
      cwd: rootDir,
      env: clientEnv,
      stdio: "inherit",
    },
  );
  execFileSync(
    runner,
    pnpmArgs(["--filter", "./client", "--fail-if-no-match", "build"]),
    {
      cwd: rootDir,
      env: clientEnv,
      stdio: "inherit",
    },
  );
}

const port = process.env.E2E_PORT || "4173";
const preview = spawn(
  runner,
  pnpmArgs([
    "--filter",
    "./client",
    "exec",
    "vite",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    port,
    "--strictPort",
  ]),
  {
    cwd: rootDir,
    env: clientEnv,
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!preview.killed) {
      preview.kill(signal);
    }
  });
}

preview.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 0);
});
