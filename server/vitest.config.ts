import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.config.*",
        "coverage/**",
        "dist/**",
        "server.ts", // Entry point, test via integration
        "env.ts", // Environment validation with lazy proxy - hard to unit test
        "swagger.ts", // Swagger configuration - tested via integration
      ],
      // Ratcheted to verified baseline before CI coverage enforcement was enabled
      // (historically 90/85/85/90 was aspirational because CI never ran --coverage).
      // Keep thresholds locked at or above baseline so coverage cannot regress.
      thresholds: {
        statements: 74,
        branches: 57,
        functions: 85,
        lines: 74,
      },
    },
  },
});
