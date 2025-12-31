# Contributing to LinguistNow

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Table of Contents

- [Commit Message Guidelines](#commit-message-guidelines)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Git Hooks with Husky](#git-hooks-with-husky)

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification. This project uses **semantic-release** for automatic versioning, so commit messages directly determine version bumps and changelog entries.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### CRITICAL: User-Facing vs Internal Changes

The commit type determines:

1. Whether a release is triggered
2. Whether the change appears in the changelog

#### 🚀 RELEASE-TRIGGERING Types (User-Facing Changes)

Use these **ONLY** for changes that affect end users:

| Type   | When to Use                              | Release       |
| ------ | ---------------------------------------- | ------------- |
| `feat` | New user-facing functionality            | Minor (1.x.0) |
| `fix`  | Bug fix that users can observe           | Patch (1.0.x) |
| `perf` | Performance improvement users can notice | Patch (1.0.x) |

**⚠️ IMPORTANT:**

- `fix` is ONLY for bugs that users experience, NOT for internal/CI/build issues
- `feat` is ONLY for features users interact with, NOT for developer tooling

#### 🔧 NON-RELEASE Types (Internal Changes)

Use these for internal/developer-facing changes:

| Type       | When to Use                                        | Release |
| ---------- | -------------------------------------------------- | ------- |
| `ci`       | CI/CD pipeline changes (GitHub Actions, workflows) | None    |
| `build`    | Build system, dependencies, Docker                 | None    |
| `chore`    | Maintenance tasks, config updates                  | None    |
| `docs`     | Documentation changes                              | None    |
| `refactor` | Code restructuring without behavior change         | None    |
| `style`    | Formatting, whitespace, semicolons                 | None    |
| `test`     | Adding or updating tests                           | None    |
| `revert`   | Reverting a previous commit                        | Depends |

### Decision Guide: Which Type to Use?

Ask yourself: **"Will a user notice this change?"**

```
Is this a CI/GitHub Actions change?
  → YES: Use `ci:` (not `fix(ci):`)

Is this a build/Docker/dependency change?
  → YES: Use `build:` (not `fix(build):`)

Is this fixing something users experience?
  → YES: Use `fix:` ✅
  → NO: Use the appropriate non-release type

Is this a new feature users will use?
  → YES: Use `feat:` ✅
  → NO: Use the appropriate non-release type
```

### Examples

#### ✅ CORRECT Usage

```bash
# User-facing bug fix → triggers patch release
fix(client): prevent crash when calendar is empty

# User-facing feature → triggers minor release
feat(server): add calendar export endpoint

# CI change → NO release
ci: add Node.js 22 to test matrix

# Build/Docker change → NO release
build(docker): optimize multi-stage build

# Workflow fix → NO release (it's CI, not user-facing)
ci: fix release workflow permissions

# Dependency update → NO release
build(deps): upgrade express to 5.0

# Internal refactor → NO release
refactor(server): extract auth logic to service

# Documentation → NO release
docs: update API documentation
```

#### ❌ INCORRECT Usage (Avoid These)

```bash
# WRONG: CI issues should use `ci:`, not `fix(ci):`
fix(ci): update Node.js version
# CORRECT: ci: update Node.js to v22

# WRONG: Build issues should use `build:`, not `fix(build):`
fix(build): resolve Docker build error
# CORRECT: build(docker): resolve multi-stage build error

# WRONG: Internal tooling is not a user feature
feat(ci): add semantic-release
# CORRECT: ci: add semantic-release for versioning

# WRONG: Dependency updates are not bug fixes
fix(deps): update lodash
# CORRECT: build(deps): update lodash to 4.17.21

# WRONG: Refactoring is not a feature
feat(server): reorganize file structure
# CORRECT: refactor(server): reorganize file structure
```

### Scopes

Use scopes to indicate the affected area:

| Scope      | Description                |
| ---------- | -------------------------- |
| `client`   | Frontend React application |
| `server`   | Backend Express API        |
| `shared`   | Shared types package       |
| `docker`   | Docker configuration       |
| `deps`     | Production dependencies    |
| `deps-dev` | Development dependencies   |

**Note:** For `ci:`, `build:`, `docs:` types, scope is often optional since the type itself is descriptive.

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
feat(server)!: remove deprecated /api/v1 endpoints

# or

feat(server): migrate to new authentication system

BREAKING CHANGE: OAuth tokens now use JWT format.
Clients must update their token handling.
```

### Quick Reference

| Change               | Correct Type   | Triggers Release? |
| -------------------- | -------------- | ----------------- |
| Fix user-visible bug | `fix:`         | ✅ Patch          |
| Add user feature     | `feat:`        | ✅ Minor          |
| Performance boost    | `perf:`        | ✅ Patch          |
| Fix CI workflow      | `ci:`          | ❌ No             |
| Fix Docker build     | `build:`       | ❌ No             |
| Update dependency    | `build(deps):` | ❌ No             |
| Refactor code        | `refactor:`    | ❌ No             |
| Update docs          | `docs:`        | ❌ No             |
| Add tests            | `test:`        | ❌ No             |
| Config changes       | `chore:`       | ❌ No             |

---

## Branch Naming Conventions

To keep our repository clean and organized, we follow these branch naming conventions:

### Types of Branches

- **Feature branches:** `feature/<issue-id>-<short-description>`
  - Example: `feature/1234-new-login-page`
- **Bugfix branches:** `bugfix/<issue-id>-<short-description>`
  - Example: `bugfix/5678-fix-login-bug`
- **Hotfix branches:** `hotfix/<issue-id>-<short-description>`
  - Example: `hotfix/2345-critical-fix`
- **Release branches:** `release/<version>`
  - Example: `release/v1.2.0`
- **Development branches:** `develop/<short-description>`
  - Example: `develop/ui-enhancements`
- **Experimental branches:** `experiment/<short-description>`
  - Example: `experiment/new-ui-idea`

### Guidelines

1. **Issue ID:** Include the issue or task ID related to the branch.
2. **Short Description:** Use a brief, hyphenated description of the branch purpose.
3. **Lowercase Letters:** Use lowercase letters in branch names.
4. **Hyphens for Spaces:** Use hyphens `-` to separate words.

Following these conventions helps everyone understand the purpose of each branch and keeps our development process streamlined.

---

## Git Hooks with Husky

This project uses [Husky](https://typicode.github.io/husky/) to automatically run quality checks before commits and pushes. This ensures code quality and prevents CI failures.

### Pre-commit Hook

The pre-commit hook runs automatically when you run `git commit`. It performs:

1. **Lint-staged**: Runs ESLint with auto-fix and Prettier formatting on staged files only
   - Lints TypeScript/TSX files (`*.ts`, `*.tsx`)
   - Formats JSON, Markdown, and JavaScript files
   - Auto-fixes ESLint issues where possible

2. **TypeScript type checking**: Validates types for client and server packages
   - `pnpm --filter client exec tsc --noEmit`
   - `pnpm --filter server exec tsc --noEmit`

This hook is fast because it only checks files you've actually changed.

### Pre-push Hook

The pre-push hook runs automatically when you run `git push`. It performs the same checks as CI:

1. **Full lint**: Runs ESLint on the entire codebase (`pnpm lint`)
2. **TypeScript type checking**: Validates types for client and server packages
3. **Tests**: Runs all tests for client and server packages
   - `pnpm --filter client test -- --run`
   - `pnpm --filter server test -- --run`

This hook ensures that code pushed to the repository will pass CI checks. If any check fails, the push is blocked until issues are resolved.

### Bypassing Hooks (Not Recommended)

If you need to bypass hooks in an emergency, you can use:

```bash
# Skip pre-commit hook
git commit --no-verify -m "your message"

# Skip pre-push hook
git push --no-verify
```

**Warning**: Only bypass hooks when absolutely necessary. Code that bypasses hooks will likely fail in CI and block PRs.

### Troubleshooting

If hooks aren't running:

1. Ensure Husky is installed: `pnpm install`
2. Verify hooks are executable: `ls -la .husky/`
3. Check that the `prepare` script ran: `pnpm prepare`

If lint-staged fails:

- Check that prettier is installed at root: `pnpm list prettier`
- Ensure your staged files match the patterns in `.lintstagedrc.js`
