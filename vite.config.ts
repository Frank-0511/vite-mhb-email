import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { dashboardPlugin } from "./scripts/vite/plugins/dashboard.ts";
import { lucideInlinePlugin } from "./scripts/vite/plugins/lucide-inline.ts";
import { maizzlePlugin } from "./scripts/vite/plugins/maizzle-dev-server.ts";
import { createPageResolverPlugin } from "./scripts/vite/plugins/page-resolver.ts";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "src/web",
  server: {
    open: true,
    middlewareMode: false,
    watch: {
      // Prevent the selective build from triggering HMR/full-reload when it
      // writes to dist/ or .cache/. The preview uses /api/render, not dist/.
      ignored: ["**/dist/**", "**/.cache/**"],
    },
  },
  plugins: [
    maizzlePlugin(rootDir),
    lucideInlinePlugin(),
    dashboardPlugin(rootDir),
    createPageResolverPlugin(),
  ],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "src/web/features/home/index.html"),
        library: path.resolve(rootDir, "src/web/features/library/components-library.html"),
        preview: path.resolve(rootDir, "src/web/features/preview/preview.html"),
      },
    },
  },
});
