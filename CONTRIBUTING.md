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
