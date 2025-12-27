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
      ],
      thresholds: {
        statements: 95,
        branches: 75,
        functions: 100,
        lines: 95,
      },
    },
  },
});
