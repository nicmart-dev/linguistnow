#!/usr/bin/env node

/**
 * Validates YAML files across the repository or from staged arguments.
 * Enforces YAML 1.2 syntax compliance and strict rules (e.g. unique keys,
 * valid block scalar indentation).
 *
 * Usage:
 *   node scripts/validate-yaml.mjs               # Scans all repo YAML files
 *   node scripts/validate-yaml.mjs file1.yml ... # Validates specific files
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "test-results",
  "playwright-report",
  ".next",
]);

/**
 * Recursively find all YAML files in dir (fallback if git is unavailable).
 */
function walkYamlFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          results.push(...walkYamlFiles(path.join(dir, entry.name)));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".yml" || ext === ".yaml") {
          results.push(path.join(dir, entry.name));
        }
      }
    }
  } catch {
    // Ignore unreadable directories
  }
  return results;
}

/**
 * Discover all tracked and untracked (non-ignored) YAML files in the repository.
 */
function discoverRepoYamlFiles() {
  try {
    const stdout = execSync(
      'git ls-files --cached --others --exclude-standard "*.yml" "*.yaml"',
      { cwd: ROOT_DIR, encoding: "utf-8" },
    );
    const files = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((rel) => path.resolve(ROOT_DIR, rel));
    if (files.length > 0) {
      return files;
    }
  } catch {
    // Git command failed; use recursive filesystem search
  }
  return walkYamlFiles(ROOT_DIR);
}

/**
 * Validates a single YAML file.
 * Returns array of error message strings (empty if valid).
 */
export function validateYamlContent(content, filename = "inline.yaml") {
  const errors = [];
  if (!content || !content.trim()) {
    return errors;
  }

  try {
    const docs = YAML.parseAllDocuments(content, {
      prettyErrors: true,
      strict: true,
    });

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc.errors && doc.errors.length > 0) {
        for (const err of doc.errors) {
          const docPrefix = docs.length > 1 ? `[doc ${i + 1}] ` : "";
          const pos = err.linePos
            ? `:${err.linePos[0]?.line || 1}:${err.linePos[0]?.col || 1}`
            : "";
          errors.push(
            `${filename}${pos} - ${docPrefix}${err.message || String(err)}`,
          );
        }
      }
    }
  } catch (err) {
    errors.push(
      `${filename} - Unhandled parse error: ${err.message || String(err)}`,
    );
  }

  return errors;
}

/**
 * Main validation runner.
 */
export function runValidation(targetArgs = process.argv.slice(2)) {
  let candidateFiles = [];

  if (targetArgs.length > 0) {
    candidateFiles = targetArgs
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === ".yml" || ext === ".yaml";
      })
      .map((file) => path.resolve(ROOT_DIR, file));
  } else {
    candidateFiles = discoverRepoYamlFiles();
  }

  // Filter for files that exist on disk (handles deleted staged files)
  const filesToValidate = candidateFiles.filter((filePath) => {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  });

  if (filesToValidate.length === 0) {
    console.log("ℹ️  No YAML files found or specified to validate.");
    return 0;
  }

  console.log(`🔍 Validating ${filesToValidate.length} YAML file(s)...`);
  let totalErrors = 0;

  for (const filePath of filesToValidate) {
    const relPath = path.relative(ROOT_DIR, filePath);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const errors = validateYamlContent(content, relPath);

      if (errors.length > 0) {
        totalErrors += errors.length;
        console.error(`\n❌ Syntax error in ${relPath}:`);
        for (const err of errors) {
          console.error(`   ${err}`);
        }
      }
    } catch (err) {
      totalErrors++;
      console.error(`\n❌ Could not read ${relPath}: ${err.message}`);
    }
  }

  if (totalErrors > 0) {
    console.error(
      `\n💥 YAML validation failed with ${totalErrors} syntax error(s).`,
    );
    return 1;
  }

  console.log(
    `✅ YAML validation passed: ${filesToValidate.length} file(s) checked with 0 syntax errors.`,
  );
  return 0;
}

// Execute CLI directly when run as script
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const exitCode = runValidation();
  process.exit(exitCode);
}
