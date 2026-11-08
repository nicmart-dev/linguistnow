#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const TEST_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  "test-results",
  "playwright-report",
]);

const MINIMUM_COVERAGE_FLOORS = {
  "client/vitest.config.ts": {
    statements: 80,
    branches: 65,
    functions: 75,
    lines: 80,
  },
  "server/vitest.config.ts": {
    statements: 74,
    branches: 57,
    functions: 85,
    lines: 74,
  },
  "shared/vitest.config.ts": {
    statements: 90,
    branches: 85,
    functions: 85,
    lines: 90,
  },
};

const errors = [];
const warnings = [];

function findTestFiles(dir) {
  const testFiles = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          testFiles.push(...findTestFiles(join(dir, entry.name)));
        }
      } else if (entry.isFile()) {
        const name = entry.name;
        const ext = extname(name);
        if (TEST_EXTENSIONS.has(ext)) {
          if (name.includes(".test.") || name.includes(".spec.")) {
            testFiles.push(join(dir, name));
          }
        }
      }
    }
  } catch (err) {
    errors.push(`Failed to read directory ${dir}: ${err.message}`);
  }
  return testFiles;
}

// 1. Scan for test focus (.only) and undocumented skipping (.skip)
console.log(
  "🔍 Scanning test files for focus (.only) and silenced (.skip) assertions...",
);
const allTestFiles = [
  ...findTestFiles(join(ROOT_DIR, "client")),
  ...findTestFiles(join(ROOT_DIR, "server")),
  ...findTestFiles(join(ROOT_DIR, "shared")),
  ...findTestFiles(join(ROOT_DIR, "e2e")),
];

console.log(`Found ${allTestFiles.length} test files to inspect.`);

for (const filePath of allTestFiles) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Check for .only (it.only, test.only, describe.only)
    if (/\b(it|test|describe)\.only\s*\(/.test(trimmed)) {
      errors.push(
        `[FOCUS] ${filePath}:${lineNum} contains forbidden .only() focus filter: "${trimmed}"`,
      );
    }

    // Check for .skip without explanation/issue reference
    if (/\b(it|test|describe)\.skip\s*\(/.test(trimmed)) {
      const hasIssueRef =
        /#\d+|TODO|FIXME|ISSUE|quarantine/i.test(trimmed) ||
        (index > 0 &&
          /#\d+|TODO|FIXME|ISSUE|quarantine/i.test(lines[index - 1]));
      if (!hasIssueRef) {
        warnings.push(
          `[SKIP] ${filePath}:${lineNum} contains .skip() without an issue or TODO reference: "${trimmed}"`,
        );
      }
    }
  });
}

// 2. Enforce coverage threshold floors in vitest configs
console.log(
  "🔍 Verifying coverage thresholds cannot be lowered below baseline floors...",
);
for (const [relPath, minFloors] of Object.entries(MINIMUM_COVERAGE_FLOORS)) {
  const fullPath = join(ROOT_DIR, relPath);
  if (!existsSync(fullPath)) {
    errors.push(`Expected config file not found: ${relPath}`);
    continue;
  }

  const content = readFileSync(fullPath, "utf-8");
  for (const [metric, minFloor] of Object.entries(minFloors)) {
    const match = new RegExp(`${metric}:\\s*(\\d+)`, "m").exec(content);
    if (!match) {
      errors.push(`Missing '${metric}' coverage threshold in ${relPath}`);
    } else {
      const configuredVal = parseInt(match[1], 10);
      if (configuredVal < minFloor) {
        errors.push(
          `Coverage threshold regression in ${relPath}: '${metric}' is set to ${configuredVal}%, but floor is ${minFloor}%`,
        );
      }
    }
  }
}

// 3. If running against base branch (e.g. PR check), check deleted test files
const baseRef =
  process.env.BASE_REF ||
  (process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : null);
if (baseRef) {
  console.log(`🔍 Checking deleted test files against base ref: ${baseRef}...`);
  try {
    const deletedFiles = execSync(
      `git diff --name-only --diff-filter=D ${baseRef}...HEAD`,
      { encoding: "utf-8" },
    )
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const deletedTests = deletedFiles.filter(
      (f) =>
        (f.includes(".test.") || f.includes(".spec.")) &&
        TEST_EXTENSIONS.has(extname(f)),
    );

    if (deletedTests.length > 0) {
      warnings.push(
        `PR deletes ${deletedTests.length} test files: ${deletedTests.join(", ")}`,
      );
    }
  } catch (err) {
    console.warn(`Could not diff against ${baseRef}: ${err.message}`);
  }
}

// Summary and exit
if (warnings.length > 0) {
  console.log("\n⚠️ Integrity Warnings:");
  for (const w of warnings) {
    console.log(`  ${w}`);
  }
}

if (errors.length > 0) {
  console.error("\n❌ Test Integrity Violations:");
  for (const err of errors) {
    console.error(`  ${err}`);
  }
  process.exit(1);
}

console.log(
  "\n✅ Test suite integrity verification passed cleanly (0 errors).",
);
