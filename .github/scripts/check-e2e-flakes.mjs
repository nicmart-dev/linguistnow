import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";

const REPORT_PATH = resolve(
  process.cwd(),
  process.env.E2E_JSON_REPORT || "e2e/test-results/results.json",
);

function collectSpecs(suite, prefix = [], out = []) {
  const nextPrefix = suite.title ? [...prefix, suite.title] : prefix;
  for (const spec of suite.specs ?? []) {
    const title = [...nextPrefix, spec.title].join(" > ");
    for (const test of spec.tests ?? []) {
      out.push({
        title,
        project: test.projectName || "unknown",
        status: test.status,
        results: test.results ?? [],
      });
    }
  }
  for (const child of suite.suites ?? []) {
    collectSpecs(child, nextPrefix, out);
  }
  return out;
}

function main() {
  if (!existsSync(REPORT_PATH)) {
    console.log(`No Playwright JSON report found at ${REPORT_PATH}`);
    return;
  }

  const report = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
  const tests = (report.suites ?? []).flatMap((suite) => collectSpecs(suite));
  const flaky = tests.filter((t) => t.status === "flaky");

  if (flaky.length === 0) {
    console.log(
      `E2E reliability check: ${String(tests.length)} tests ran with 0 flakes.`,
    );
    return;
  }

  const summaryLines = [
    "## ⚠️ Flaky E2E Tests Detected (Passed on Retry)",
    "",
    "| Test | Browser | Attempts |",
    "|------|---------|----------|",
  ];

  for (const item of flaky) {
    console.log(
      `::warning::Flaky E2E test passed on retry (${item.project}): ${item.title}`,
    );
    summaryLines.push(
      `| ${item.title.replace(/\|/g, "\\|")} | ${item.project} | ${String(item.results.length)} |`,
    );
  }

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    appendFileSync(summaryFile, `${summaryLines.join("\n")}\n`);
  }
}

main();
