#!/usr/bin/env node

/**
 * Verifies non-optional peerDependencies across installed pnpm packages.
 * `pnpm install --frozen-lockfile` skips dependency resolution and does not report
 * peer mismatches, so this script checks the resolved `node_modules/.pnpm` graph
 * directly and fails on any missing peer or unallowlisted version mismatch.
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const pnpmDir = path.join(rootDir, "node_modules", ".pnpm");

if (!fs.existsSync(pnpmDir)) {
  console.error("Missing node_modules/.pnpm; run `pnpm install` first.");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const semverEntry = fs
  .readdirSync(pnpmDir)
  .find((entry) => entry.startsWith("semver@"));

if (!semverEntry) {
  console.error("Could not locate semver inside node_modules/.pnpm.");
  process.exit(1);
}

const semver = require(
  path.join(pnpmDir, semverEntry, "node_modules", "semver"),
);

/**
 * Known pre-existing peer dependency mismatches accepted today.
 * New mismatches introduced by future updates will fail CI unless fixed or
 * explicitly reviewed and added here.
 */
const ALLOWED_MISMATCHES = [
  {
    pkg: "eslint-plugin-react",
    peer: "eslint",
    reason: "ESLint 10 upgraded ahead of eslint-plugin-react peer range",
  },
  {
    pkg: "vite-plugin-pwa",
    peer: "workbox-build",
    reason: "Lockfile resolves workbox-build@7.4.0 vs ^7.4.1 peer range",
  },
  {
    pkg: "vite-plugin-pwa",
    peer: "workbox-window",
    reason: "Lockfile resolves workbox-window@7.4.0 vs ^7.4.1 peer range",
  },
];

function isRangeSatisfied(actual, rawRange) {
  const branches = rawRange
    .split("||")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const branch of branches) {
    if (semver.validRange(branch)) {
      if (semver.satisfies(actual, branch, { includePrerelease: true })) {
        return true;
      }
    }
  }
  return false;
}

function isAllowlisted(pkg, peer) {
  return ALLOWED_MISMATCHES.some(
    (entry) => entry.pkg === pkg && entry.peer === peer,
  );
}

const entries = fs
  .readdirSync(pnpmDir)
  .filter((d) => d !== "node_modules" && d !== "lock.yaml");

const unallowlisted = [];
const allowlistedSeen = [];

for (const entry of entries) {
  const nm = path.join(pnpmDir, entry, "node_modules");
  if (!fs.existsSync(nm)) continue;

  const pkgDirs = [];
  for (const item of fs.readdirSync(nm)) {
    if (item.startsWith("@")) {
      const scopeDir = path.join(nm, item);
      if (fs.statSync(scopeDir).isDirectory()) {
        for (const sub of fs.readdirSync(scopeDir)) {
          pkgDirs.push(path.join(scopeDir, sub));
        }
      }
    } else {
      pkgDirs.push(path.join(nm, item));
    }
  }

  const entryRoot = path.resolve(pnpmDir, entry);
  for (const pkgPath of pkgDirs) {
    let real;
    try {
      real = fs.realpathSync(pkgPath);
    } catch {
      continue;
    }
    if (!real.startsWith(entryRoot)) continue;

    const pkgJsonPath = path.join(pkgPath, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;

    const pj = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    if (!pj.peerDependencies) continue;

    for (const [peer, range] of Object.entries(pj.peerDependencies)) {
      if (pj.peerDependenciesMeta?.[peer]?.optional) continue;

      const peerPkgJsonPath = path.join(nm, ...peer.split("/"), "package.json");
      if (!fs.existsSync(peerPkgJsonPath)) {
        unallowlisted.push({
          pkg: pj.name,
          version: pj.version,
          peer,
          range,
          actual: "MISSING",
        });
        continue;
      }

      const actual = JSON.parse(
        fs.readFileSync(peerPkgJsonPath, "utf8"),
      ).version;
      if (!isRangeSatisfied(actual, range)) {
        const issue = {
          pkg: pj.name,
          version: pj.version,
          peer,
          range,
          actual,
        };
        if (isAllowlisted(pj.name, peer)) {
          allowlistedSeen.push(issue);
        } else {
          unallowlisted.push(issue);
        }
      }
    }
  }
}

if (allowlistedSeen.length > 0) {
  console.log(
    `Allowlisted peer mismatches (${allowlistedSeen.length}):`,
    allowlistedSeen
      .map(
        (i) =>
          `${i.pkg}@${i.version} -> ${i.peer}@${i.actual} (wants ${i.range})`,
      )
      .join("; "),
  );
}

if (unallowlisted.length > 0) {
  console.error("\nUnallowlisted peer dependency issues found:");
  for (const issue of unallowlisted) {
    console.error(
      `  - ${issue.pkg}@${issue.version} requires ${issue.peer} "${issue.range}", found "${issue.actual}"`,
    );
  }
  process.exit(1);
}

console.log("Peer dependency check passed.");
