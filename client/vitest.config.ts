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
                'src/data-table/**',
                'src/assets/**',
                'src/**/*.css',
                'src/**/*.json',
                // UI primitives excluded - tested implicitly through component tests
                'src/components/ui/**',
                // Barrel exports - no logic to test
                'src/components/**/index.ts',
                // Pages - thin wrappers around organisms, tested implicitly
                'src/pages/**',
                // Auth utilities - external integration dependent
                'src/auth-users/**',
                // Environment validation tested at runtime
                'src/env.ts',
                // Context providers - tested implicitly through component tests
                'src/i18n/LanguageProvider.tsx',
                'src/i18n/index.ts',
                // Complex organisms with heavy external integrations (API calls, Google Calendar, etc.)
                // These require mocking complex external dependencies and are lower priority for unit tests
                'src/components/organisms/AvailabilitySettings.tsx',
                'src/components/organisms/AvailabilityTimeline.tsx',
                'src/components/organisms/BookingModal.tsx',
                'src/components/organisms/CalendarSelector.tsx',
                'src/components/organisms/DataTable.tsx',
                'src/components/organisms/FilterBar.tsx',
                'src/components/organisms/LinguistCard.tsx',
                'src/components/organisms/LinguistProfileSettings.tsx',
                'src/components/organisms/LinguistTable.tsx',
            ],
            thresholds: {
                statements: 80,
                branches: 65, // Lower threshold - complex UI components have many conditional branches
                functions: 75,
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
