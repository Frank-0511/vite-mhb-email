import { renderLucideIcon } from "../lib/render-lucide-icon.js";

// Matches static, empty `<i data-lucide="name" ...other-attrs></i>` placeholders
// as authored directly in the HTML entry files (not ones injected at runtime).
const LUCIDE_PLACEHOLDER_RE = /<i\b([^>]*?)\bdata-lucide="([\w-]+)"([^>]*?)>\s*<\/i>/g;

function parseAttrs(attrString) {
  const attrs = {};
  const attrRegex = /([\w-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

// Pre-renders static Lucide icon placeholders into real inline SVG at
// build/dev time, so they're visible on first paint instead of popping in
// once the client-side `createIcons()` call runs.
export const lucideInlinePlugin = () => ({
  name: "vite-lucide-inline",
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return html.replace(LUCIDE_PLACEHOLDER_RE, (match, before, iconName, after) => {
        const attrs = parseAttrs(`${before} ${after}`);
        const svg = renderLucideIcon(iconName, attrs);
        if (!svg) {
          console.warn(
            `[vite-lucide-inline] Unknown icon "${iconName}", leaving <i> placeholder as-is.`,
          );
          return match;
        }
        return svg;
      });
    },
  },
});
