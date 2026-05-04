import { resolve } from "node:path";
import { defineConfig } from "vite";
import { dashboardPlugin } from "./scripts/vite/plugins/dashboard.js";
import { maizzlePlugin } from "./scripts/vite/plugins/maizzle.js";
import { createPageResolverPlugin } from "./scripts/vite/plugins/page-resolver.js";

const rootDir = __dirname;

export default defineConfig({
  root: "src/web",
  server: {
    open: true,
    middlewareMode: false,
  },
  plugins: [maizzlePlugin(rootDir), dashboardPlugin(rootDir), createPageResolverPlugin()],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/web/features/home/index.html"),
        library: resolve(__dirname, "src/web/features/library/components-library.html"),
        preview: resolve(__dirname, "src/web/features/preview/preview.html"),
      },
    },
  },
});
