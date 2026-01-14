---
name: Oxlint Hybrid Setup
overview: Add Oxlint as a fast first-pass linter alongside ESLint, leveraging the hybrid approach for faster feedback while preserving type-checked rules. This plan corrects several issues in the original plan based on current project configuration and latest oxlint documentation.
todos:
  - id: update-plan-doc
    content: Update plan document with corrected config filename, schema path, and ignore approach
    status: pending
  - id: fix-plan-tables
    content: Fix broken markdown tables in the plan document
    status: pending
  - id: fix-mermaid
    content: Remove <br/> tags from mermaid diagram
    status: pending
  - id: remove-ci-section
    content: Remove or mark CI workflow section as optional (no workflows exist)
    status: pending
  - id: add-migration-tool
    content: Add @oxlint/migrate tool mention to the plan
    status: pending
---

# Oxlint Hybrid Setup Plan

## Issues Found in Original Plan

| Issue | Original | Corrected |

| ------------------- | -------------------- | ------------------------------------------------------------------ |

| Config filename | `oxlint.json` | `.oxlintrc.json` (dot prefix) |

| Schema reference | Remote URL | Local: `./node_modules/oxlint/configuration_schema.json` |

| Ignore config | `ignorePatterns` key | Use `.oxlintignore` file or CLI `--ignore-pattern` |

| Missing tool | Not mentioned | Add `@oxlint/migrate` for easier ESLint migration |

| ESLint config order | Unclear placement | Must place after strictTypeChecked, before file-specific overrides |

| Lint-staged | Missing prettier | Preserve existing prettier integration |

| CI Workflows | Section included | No `.github/workflows` exists - remove or make optional |

---

## Corrected Implementation

### 1. Install Dependencies

```bash
pnpm add -D oxlint eslint-plugin-oxlint
```

Optional migration helper:

```bash
npx @oxlint/migrate  # Auto-converts ESLint config to oxlint format
```

### 2. Create `.oxlintrc.json` (corrected filename)

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

### 3. Create `.oxlintignore` (separate file for ignores)

```
**/dist/**
**/dev-dist/**
**/build/**
**/node_modules/**
**/coverage/**
scripts/**
```

### 4. Update [`eslint.config.mjs`](<linguistnow%20(main)/eslint.config.mjs>) (corrected placement)

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import oxlint from "eslint-plugin-oxlint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  // ADD HERE: After base configs, before file-specific overrides
  oxlint.configs["flat/recommended"],
  {
    languageOptions: {
      // ... existing parserOptions
    },
  }
  // ... rest of existing file-specific configurations
);
```

### 5. Update [`package.json`](<linguistnow%20(main)/package.json>) scripts

```json
{
  "scripts": {
    "lint:ox": "oxlint .",
    "lint:eslint": "eslint .",
    "lint": "oxlint . && eslint .",
    "lint:fix": "oxlint --fix . && eslint . --fix"
  }
}
```

### 6. Update [`.lintstagedrc.js`](<linguistnow%20(main)/.lintstagedrc.js>) (preserve prettier)

```javascript
module.exports = {
  "*.{ts,tsx}": ["oxlint --fix", "eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs}": ["oxlint --fix", "eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"],
};
```

### 7. Update [`.gitignore`](<linguistnow%20(main)/.gitignore>)

Add:

```
# Oxlint
.oxlintignore
```

Wait - `.oxlintignore` should NOT be gitignored. Instead add cache if using:

```
# Oxlint cache
.oxlint-cache
```

---

## Sections to Remove/Update in Plan Document

1. **Remove CI Workflow Section** - No `.github/workflows` directory exists. Make this section conditional or remove entirely.

2. **Fix Mermaid Diagram** - The diagram has `<br/>` tags which render as literal text. Replace with cleaner labels.

3. **Update Table Formatting** - Several tables have broken markdown (missing newlines between rows).

---

## Summary of Changes

| File | Action |

| ------------------- | ------------------------------------------- |

| `.oxlintrc.json` | Create (not `oxlint.json`) |

| `.oxlintignore` | Create (for ignore patterns) |

| `eslint.config.mjs` | Add oxlint plugin import and config |

| `package.json` | Add `lint:ox`, update `lint` and `lint:fix` |

| `.lintstagedrc.js` | Add oxlint, preserve prettier |

| `.gitignore` | Add `.oxlint-cache` |
