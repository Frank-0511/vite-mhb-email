import { resolve } from "node:path";
import { defineConfig } from "vite";
import { dashboardPlugin } from "./scripts/vite-plugins/dashboard.js";
import { maizzlePlugin } from "./scripts/vite-plugins/maizzle.js";

const rootDir = __dirname;

export default defineConfig({
  root: "src/web",
  server: {
    open: true,
  },
  plugins: [maizzlePlugin(rootDir), dashboardPlugin(rootDir)],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/web/index.html"),
        library: resolve(__dirname, "src/web/components-library.html"),
        preview: resolve(__dirname, "src/web/preview.html"),
      },
    },
  },
});
