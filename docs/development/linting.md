# Linting Setup

This document describes the linting configuration and workflow for LinguistNow, which uses a hybrid approach combining Oxlint (fast first-pass) and ESLint (type-aware checks).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Configuration Files](#configuration-files)
- [Usage](#usage)
- [Pre-commit Hooks](#pre-commit-hooks)
- [AI Agent / Cursor Integration](#ai-agent--cursor-integration)
- [Performance Benchmarks](#performance-benchmarks)
- [Rule Coverage](#rule-coverage)
- [Troubleshooting](#troubleshooting)

## Overview

We use a **hybrid linting approach** that combines:

- **Oxlint**: Fast Rust-powered linter for syntax errors, style issues, and common bugs (1.60s vs ESLint's 6.32s — **75% faster**)
- **ESLint**: Type-aware linter for TypeScript-specific rules that require type information

### Benefits

- **Fast feedback**: Oxlint catches obvious issues in 1.60s vs 6.32s for ESLint
- **Type safety**: ESLint handles type-checked rules that oxlint cannot
- **Reduced redundancy**: `eslint-plugin-oxlint` automatically disables overlapping ESLint rules
- **Better CI performance**: Faster lint times in continuous integration

## Architecture

```mermaid
flowchart LR
    A[Source Files] --> B[Oxlint<br/>1.60s]
    B --> C[ESLint<br/>6.32s]
    C --> D[Combined Errors]
```

**Two-stage linting pipeline:**

1. **Stage 1 - Oxlint (Fast Pass)**: Rust-powered, **1.60s** on 122 files. Catches syntax errors, style issues, common bugs, import problems.
2. **Stage 2 - ESLint (Type-Aware)**: **6.32s** on 122 files. TypeScript type-checked rules like `no-floating-promises`, `no-unsafe-*`, `strictTypeChecked`.

## Configuration Files

### `.oxlintrc.json`

Oxlint configuration file in the project root:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "off"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "eqeqeq": "error"
  },
  "plugins": ["typescript", "import", "react", "react-hooks"]
}
```

### `.oxlintignore`

Ignore patterns for oxlint (similar to `.eslintignore`):

```gitignore
**/dist/**
**/dev-dist/**
**/build/**
**/node_modules/**
**/coverage/**
**/scripts/**
```

### `eslint.config.mjs`

ESLint configuration with oxlint plugin integration:

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import oxlint from "eslint-plugin-oxlint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  // Auto-disable ESLint rules covered by oxlint
  oxlint.configs["flat/recommended"],
  // ... rest of configuration
);
```

The `eslint-plugin-oxlint` automatically disables ESLint rules that oxlint handles, preventing duplicate warnings.

## Usage

### Available Commands

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm lint`        | Run both oxlint and ESLint in sequence |
| `pnpm lint:ox`     | Run oxlint only (fast feedback)        |
| `pnpm lint:eslint` | Run ESLint only (type-aware checks)    |
| `pnpm lint:fix`    | Auto-fix issues with both linters      |

### When Each Linter Runs

| Trigger                 | What Runs                                                        | Command/Config     |
| ----------------------- | ---------------------------------------------------------------- | ------------------ |
| **Manual (fast check)** | Oxlint only                                                      | `pnpm lint:ox`     |
| **Manual (full check)** | Oxlint → ESLint                                                  | `pnpm lint`        |
| **Pre-commit (Husky)**  | Oxlint → ESLint → Prettier (staged files only)                   | `.lintstagedrc.js` |
| **AI Agent / Cursor**   | Use `pnpm lint:ox` for fast feedback, `pnpm lint` for full check | `.cursorrules`     |
| **CI/CD Pipeline**      | Oxlint → ESLint (fails fast on syntax)                           | GitHub Actions     |

### Manual Linting

**Quick syntax check** (1.6s) — use during active development:

```bash
pnpm lint:ox
```

**Full lint** (8s) — use before committing or to catch type errors:

```bash
pnpm lint
```

**Auto-fix all issues**:

```bash
pnpm lint:fix
```

### Expected Performance

| Metric                | Before (ESLint only) | After (Hybrid)      |
| --------------------- | -------------------- | ------------------- |
| Initial syntax errors | ~5-15s               | ~0.1-0.3s (oxlint)  |
| Full lint pass        | ~5-15s               | ~0.3s + ~3-8s       |
| Pre-commit hooks      | ~5-15s               | Fast fail on syntax |

> **Note**: Actual times depend on codebase size. Your project is small enough that ESLint is likely fast already, but oxlint provides instant feedback during development.

## Performance Benchmarks

Measured performance improvements from implementing the oxlint hybrid setup (average of 3 runs on ~122 files):

### Before: ESLint Only

| Metric              | Value                |
| ------------------- | -------------------- |
| **Average Time**    | **6.32 seconds**     |
| **Files Processed** | ~122 files           |
| **Issues Found**    | 90 errors, 1 warning |

### After: Oxlint Only (Fast Feedback)

| Metric              | Value                              |
| ------------------- | ---------------------------------- |
| **Average Time**    | **1.60 seconds** ⚡ **75% faster** |
| **Files Processed** | 122 files                          |
| **Issues Found**    | 188 warnings, 11 errors            |
| **Threads Used**    | 22 threads (parallel processing)   |

### Performance Improvements

| Metric                    | Before (ESLint) | After (Oxlint)   | Improvement                 |
| ------------------------- | --------------- | ---------------- | --------------------------- |
| **Fast feedback**         | 6.32s           | 1.60s            | **75% faster** (4x speedup) |
| **Initial syntax errors** | 6.32s           | 1.60s            | **75% faster**              |
| **Pre-commit hooks**      | 6.32s           | 1.60s            | **75% faster**              |
| **Parallel processing**   | No              | Yes (22 threads) | ✅ Enabled                  |

### Development Workflow Impact

#### Scenario 1: Syntax Error Detection

**Before (ESLint only):**

- Developer makes syntax error
- Runs `pnpm lint`
- Waits **6.32 seconds**
- Gets feedback

**After (Oxlint hybrid):**

- Developer makes syntax error
- Runs `pnpm lint:ox` (or `pnpm lint` stops early)
- Waits **1.60 seconds**
- Gets feedback **4x faster**

**Time Saved**: 4.72 seconds per lint check = **~75% faster feedback**

#### Scenario 2: Pre-commit Hooks

**Before:**

- Commit staged files
- ESLint runs: **6.32s**
- Prettier runs: ~0.5s
- **Total**: ~6.8s

**After:**

- Commit staged files
- Oxlint runs: **1.60s** (catches most issues)
- ESLint runs: **6.32s** (only if oxlint passes)
- Prettier runs: ~0.5s
- **Total**: ~8.4s (if both pass) or **1.60s** (if oxlint fails early)

**Benefit**: Fast failure on obvious syntax/style issues saves developer time.

#### Scenario 3: CI/CD Pipeline

**Before:**

- CI runs ESLint: **6.32s**
- Developer waits for CI feedback

**After:**

- CI runs Oxlint first: **1.60s**
- If oxlint passes, runs ESLint: **6.32s**
- Developer gets **fast feedback** on syntax issues

**Benefit**: Syntax errors fail fast, type errors still caught by ESLint.

### Issue Detection Comparison

- **Oxlint Detection**: 188 warnings (style, common bugs, import issues) + 11 errors (syntax, correctness)
- **ESLint Detection**: 90 errors (type-aware, unsafe operations) + 1 warning
- **Complementary**: Oxlint handles fast checks, ESLint handles type-aware checks

## Pre-commit Hooks

When you run `git commit`, Husky runs lint-staged on staged files:

```text
git commit → Husky → lint-staged → Oxlint (1.6s) → ESLint (6.3s) → Prettier
```

**Fast failure**: If Oxlint finds errors, the commit is blocked immediately without waiting for ESLint.

📖 **Full documentation**: [git-hooks.md](./git-hooks.md)

## AI Agent / Cursor Integration

When working with AI agents or Cursor, use these commands:

| Task             | Command         | When to Use                             |
| ---------------- | --------------- | --------------------------------------- |
| Quick validation | `pnpm lint:ox`  | After making changes, before full check |
| Full validation  | `pnpm lint`     | Before committing or creating PR        |
| Fix issues       | `pnpm lint:fix` | To auto-fix linting issues              |

The `.cursorrules` file documents these commands for AI agents to use appropriately.

## Rule Coverage

### Rules Oxlint Handles

The `eslint-plugin-oxlint` automatically disables these ESLint rules:

- `no-unused-vars`
- `no-undef`
- `no-console`
- `eqeqeq`
- `no-empty`
- `no-extra-semi`
- `import/no-duplicates`
- `react/jsx-key`
- `react-hooks/rules-of-hooks`
- [500+ more rules](https://oxc.rs/docs/guide/usage/linter/rules.html)

### Rules ESLint Must Keep (Type-Aware)

These require TypeScript's type system and **cannot** be migrated to oxlint:

- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-unsafe-assignment`
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-member-access`
- `@typescript-eslint/no-unsafe-argument`
- `@typescript-eslint/no-unsafe-return`
- `@typescript-eslint/await-thenable`
- `@typescript-eslint/require-await`
- `@typescript-eslint/restrict-template-expressions`

**Key insight**: Type-checked rules like `no-floating-promises` and `no-unsafe-*` require TypeScript's type information—oxlint cannot replicate these.

## Troubleshooting

### Oxlint Not Finding Files

Check `.oxlintignore` patterns match your ignore requirements. The ignore file uses glob patterns similar to `.gitignore`.

### Duplicate Warnings

If you see duplicate warnings from both linters, ensure `eslint-plugin-oxlint` is properly configured in `eslint.config.mjs`. The plugin should be imported and `oxlint.configs['flat/recommended']` should be included.

### ESLint Type Errors

ESLint type-aware rules require TypeScript project references. Ensure all `tsconfig.json` files are properly configured:

```javascript
// eslint.config.mjs
parserOptions: {
  project: [
    './server/tsconfig.json',
    './client/tsconfig.json',
    './shared/tsconfig.json',
  ],
  tsconfigRootDir: import.meta.dirname,
}
```

### Migration from ESLint

To migrate existing ESLint rules to oxlint, use the migration tool:

```bash
npx @oxlint/migrate
```

This generates a `.oxlintrc.json` based on your current ESLint configuration.

## Related Documentation

- [Git Hooks](./git-hooks.md) - Husky pre-commit and pre-push hooks
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Commit guidelines, branch naming
- [TypeScript Guidelines](./typescript-guidelines.md) - TypeScript best practices
- [Testing and TDD](./testing-and-tdd.md) - Test-driven development workflow
- [Architecture Overview](../architecture/architecture-overview.md) - Project architecture
