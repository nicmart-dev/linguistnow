# Autonomous Agent & Contributor Guidelines (`AGENTS.md`)

This repository is designed for **fully automated, test-gated delivery**. Autonomous AI coding agents and automated dependency tools (Renovate) can develop, test, and merge changes without manual human triage when all automated gates pass.

---

## 1. Monorepo Structure & Workspaces

The repository is a `pnpm` monorepo managed with workspace definitions:

- **`shared/` (`@linguistnow/shared`)**: Shared domain schemas (Zod), API contracts, currency conversions, and date/time formatting. **Must be built before client/server.**
- **`client/` (`linguistnow`)**: React 18 frontend with Vite, Tailwind CSS, Radix UI primitives, Lucide icons, and `@tanstack/react-table`.
- **`server/` (`linguistnow-api`)**: Express backend running on Node.js 22 with session token management, Vault client, Airtable API, and Google Calendar integrations.
- **`e2e/` (`@linguistnow/e2e`)**: Playwright end-to-end testing suite:
  - **Tier A (`playwright.config.ts`)**: Fast end-to-end user journeys against production client builds with mocked API fixtures. Includes automated WCAG 2.1 AA accessibility scans (`@axe-core/playwright`).
  - **Tier B (`playwright.smoke.config.ts`)**: Container smoke suite executed against live Docker containers before image promotion.

---

## 2. Standard Commands

Always use `pnpm` (version 9.x):

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Linting & static analysis (oxlint + eslint)
pnpm lint

# TypeScript verification across all 4 workspaces
pnpm type-check

# Build shared and client packages
pnpm build

# Unit test suites with coverage threshold enforcement (>= 70%)
pnpm test:coverage

# Run Playwright Tier A E2E suite
pnpm test:e2e

# Run Playwright Tier B Container Smoke suite
pnpm test:e2e:smoke

# Test suite integrity and coverage floor check
pnpm check:test-integrity

# Check peer dependency contracts
pnpm check:peers
```

---

## 3. Commit & PR Title Standards

All commit messages and PR titles **must strictly comply** with Conventional Commits and [`commitlint.config.js`](file:///c:/Users/nicma/github-repos/linguistnow/commitlint.config.js):

- **Format:** `<type>(<scope>): <description>`
- **Allowed Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Allowed Scopes:** `client`, `server`, `shared`, `deps`, `deps-dev`, `config`, `types`, `tests`, `docs`, `ci`, `docker`.
- **Rules:**
  - Header length must be $\le 72$ characters.
  - Lowercase header (`type` and `scope`).
  - No trailing period in header.
  - Squash-merged commit titles inherit the PR title (`squash_merge_commit_title: "PR_TITLE"`).

---

## 4. Invariant Rules & Gate Policies

### 🔒 Rule 1: Never Weaken the Gate

Agents must **never** modify test configurations, delete existing test files, skip failing tests, or lower coverage thresholds to make CI pass.

- Focus filters (`test.only`, `it.only`, `describe.only`) are prohibited and blocked by `check-test-integrity.mjs`.
- Silenced tests (`test.skip`) must reference an active issue number or TODO explanation.
- Minimum coverage floors are locked (`client`: 80/65/75/80, `server`: 74/57/85/74, `shared`: 90/85/85/90).

### 🔒 Rule 2: Gate Files Require Owner Review

Files defined in [`.github/CODEOWNERS`](file:///c:/Users/nicma/github-repos/linguistnow/.github/CODEOWNERS) require manual review by `@nicmart-dev`. Touching these files prevents zero-click automerge.

### 🔒 Rule 3: Zero PAT Leakage & Scoped Permissions

- Workflows must **never** persist personal access tokens (PATs) or checkout with write-capable PATs before running dependency lifecycle scripts.
- The `linguistnow-bot` GitHub App has scoped permissions (`Contents: read/write`, `Pull requests: read/write`) and **no `workflows` permission**.

### 🔒 Rule 4: Accessibility Standard

All user-facing UI changes must maintain **WCAG 2.1 AA** compliance. Run `pnpm test:e2e` to verify that `a11y.spec.ts` reports 0 axe violations.
