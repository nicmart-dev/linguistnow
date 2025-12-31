import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
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
      'client/src/pages/**', // Pages have complex Airtable types
      '**/pages/**', // All pages directories
      'client/src/components/CalendarSelector.tsx', // Complex Airtable types
      'client/src/components/DataTable.tsx', // Complex Airtable types
      'client/src/components/LinguistTable.tsx', // Complex Airtable types
      'client/src/auth-users/utils.ts', // Complex Airtable type mappings
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

