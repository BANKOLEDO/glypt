import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@glypt/core/identity",
        replacement: fileURLToPath(new URL("./packages/core/src/identity.ts", import.meta.url)),
      },
      {
        find: "@glypt/core",
        replacement: fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 25_000,
    hookTimeout: 25_000,
  },
});
