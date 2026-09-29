import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) } },
  test: {
    environment: "jsdom",
    env: { VITE_API_BASE_URL: "http://127.0.0.1:8000" },
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
