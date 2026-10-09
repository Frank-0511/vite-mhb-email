import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
    // forks: tres suites usan process.chdir, no disponible en worker threads.
    pool: "forks",
  },
});
