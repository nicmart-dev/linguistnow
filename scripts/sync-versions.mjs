#!/usr/bin/env node

/**
 * Script to synchronize version numbers across all package.json files in the monorepo.
 * Called by semantic-release during the prepare phase.
 * 
 * Usage: node scripts/sync-versions.mjs <version>
 * Example: node scripts/sync-versions.mjs 1.2.3
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const version = process.argv[2];

if (!version) {
  console.error('Error: Version argument is required');
  console.error('Usage: node scripts/sync-versions.mjs <version>');
  process.exit(1);
}

// Validate semantic version format
const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
if (!semverRegex.test(version)) {
  console.error(`Error: Invalid version format: ${version}`);
  console.error('Expected format: X.Y.Z (e.g., 1.2.3)');
  process.exit(1);
}

const packageFiles = [
  'package.json',
  'client/package.json',
  'server/package.json',
  'shared/package.json',
];

console.log(`\n📦 Syncing versions to ${version}\n`);

for (const file of packageFiles) {
  const filePath = join(rootDir, file);
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);
    const oldVersion = pkg.version;
    
    pkg.version = version;
    
    // Preserve formatting (2 spaces, trailing newline)
    writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
    
    console.log(`  ✓ ${file}: ${oldVersion} → ${version}`);
  } catch (error) {
    console.error(`  ✗ Failed to update ${file}: ${error.message}`);
    process.exit(1);
  }
}

console.log('\n✅ All versions synchronized successfully!\n');

