import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default environment: node (keeps jsdom out of most tests)
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // DOM tests opt in via file pattern or // @vitest-environment jsdom annotation
    environmentMatchGlob: ["tests/dom/**/*.test.ts"],
  },
});
