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
    // Global ignores - only truly non-lintable files
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
      'server/airtable/**', // Airtable schema/debug files (utilities, not production code)
    ],
  },
  {
    // Configuration for client pages - relax rules for pre-existing code
    // TODO: Gradually enable stricter rules as code is migrated to use Zod validation
    files: ['client/src/pages/**/*.{ts,tsx}'],
    rules: {
      // Relax strict rules for pre-existing code patterns
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Configuration for client components with Airtable types
    // TODO: Migrate to using Zod schemas from shared package
    files: [
      'client/src/components/CalendarSelector.tsx',
      'client/src/components/DataTable.tsx',
      'client/src/components/LinguistTable.tsx',
      'client/src/components/LinguistCard.tsx',
      'client/src/auth-users/utils.ts',
      'client/src/components/Hero.tsx',
      'client/src/components/Navbar.tsx',
    ],
    rules: {
      // Relax strict rules for pre-existing code patterns
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-confusing-void-expression': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Configuration for server controllers/services with Airtable types
    // Now using Zod validation from shared package
    files: [
      'server/controllers/linguistsController.ts',
      'server/controllers/calendarController.ts',
    ],
    rules: {
      // Warn on unsafe operations - Zod validation should handle most cases
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    // Configuration for services that don't directly handle Airtable data
    files: [
      'server/services/availabilityService.ts',
      'server/services/googleCalendarClient.ts',
    ],
    rules: {
      // These services receive typed data, enable stricter checks
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
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
