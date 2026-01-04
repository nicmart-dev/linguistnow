import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Explicitly specify all TypeScript projects for proper type resolution
        // This ensures ESLint can resolve types from project references (shared package)
        // Using explicit project paths instead of projectService for better monorepo support
        project: [
          './server/tsconfig.json',
          './client/tsconfig.json',
          './shared/tsconfig.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // Configuration for non-TypeScript files (JS, MJS)
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      parserOptions: {
        project: null, // Disable type checking for JS files
      },
    },
    rules: {
      // Disable type-checking rules for JS files
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    // Configuration for test files - allow unsafe calls for mocks
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      'no-constant-binary-expression': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/dev-dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '.lintstagedrc.js',
      'commitlint.config.js',
      '**/coverage/**',
      'scripts/**', // Build/release scripts
      '**/audit-translations.js', // Utility script
      'shared/**/*.test.ts', // Shared test files
      'client/src/i18n/locales.test.ts', // i18n test file
      '**/vitest.config.ts', // Vitest config files
      '**/*.config.ts', // All config files
      'client/src/pages/**', // Pages have complex Airtable types
      '**/pages/**', // All pages directories
      'client/src/components/CalendarSelector.tsx', // Complex Airtable types
      'client/src/components/DataTable.tsx', // Complex Airtable types
      'client/src/components/LinguistTable.tsx', // Complex Airtable types
      'client/src/components/LinguistCard.tsx', // Complex Airtable types
      'client/src/auth-users/utils.ts', // Complex Airtable type mappings
      'server/airtable/**', // Airtable schema/debug files (utilities, not production code)
    ],
  },
  {
    // Configuration for components with complex Airtable types
    files: [
      'client/src/components/CalendarSelector.tsx',
      'client/src/components/DataTable.tsx',
      'client/src/components/LinguistTable.tsx',
      'client/src/auth-users/utils.ts',
      'client/src/components/Hero.tsx',
      'client/src/components/Navbar.tsx',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/only-throw-error': 'off',
    },
  },
  {
    // Configuration for server controllers/services with Airtable types
    // These files use runtime type checking but ESLint can't verify it
    files: [
      'server/controllers/linguistsController.ts',
      'server/controllers/calendarController.ts',
      'server/services/availabilityService.ts',
      'server/services/googleCalendarClient.ts',
    ],
    rules: {
      // Allow unsafe operations due to Airtable's dynamic types
      // Runtime type checking is performed (e.g., typeof checks, parseArrayField)
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off', // Airtable types can cause false positives
      // Still check for other issues
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    // Configuration for Table components with forwardRef
    files: ['client/src/components/Table.tsx', 'client/src/components/Input.tsx', 'client/src/components/Skeleton.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    // Configuration for test setup files
    files: ['**/test/setup.ts', '**/test/setup.js'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  }
);

