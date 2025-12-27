import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/vite-env.d.ts',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'src/index.tsx',
                'src/App.tsx',
                'src/pages/**',
                'src/data-table/**',
                'src/assets/**',
                'src/**/*.css',
                'src/**/*.json',
                // Complex components excluded - tested via integration
                'src/components/CalendarSelector.tsx',
                'src/components/DataTable.tsx',
                'src/components/LinguistTable.tsx',
                // Environment validation tested at runtime
                'src/env.ts',
                // Auth utils have complex import.meta.env mocking
                'src/auth-users/utils.ts',
                // Context providers - tested via integration
                'src/i18n/LanguageProvider.tsx',
                'src/i18n/index.ts',
            ],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 70,
                lines: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    optimizeDeps: {
        exclude: ['html-encoding-sniffer'],
    },
})
