import {
  ArrowLeft,
  BookOpen,
  Copy,
  Eye,
  FileOutput,
  FileText,
  List,
  Moon,
  Package,
  Rocket,
  Save,
  Sun,
  Zap,
} from "lucide";

// Icon node arrays are plain data (no DOM access), so they're safe to import
// and serialize in this Node-side (build/dev-time) module.
const ICONS = {
  "arrow-left": ArrowLeft,
  "book-open": BookOpen,
  copy: Copy,
  eye: Eye,
  "file-output": FileOutput,
  "file-text": FileText,
  list: List,
  moon: Moon,
  package: Package,
  rocket: Rocket,
  save: Save,
  sun: Sun,
  zap: Zap,
};

const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

function hasA11yProp(attrs) {
  return Object.keys(attrs).some(
    (key) => key.startsWith("aria-") || key === "role" || key === "title",
  );
}

function mergeClasses(...classGroups) {
  return classGroups
    .flat()
    .filter((cls, index, arr) => Boolean(cls) && cls.trim() !== "" && arr.indexOf(cls) === index)
    .join(" ")
    .trim();
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function renderNode([tag, attrs, children]) {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(" ");
  const childrenHtml = (children || []).map(renderNode).join("");
  return `<${tag} ${attrString}>${childrenHtml}</${tag}>`;
}

/**
 * Renders a Lucide icon as a static inline SVG string, matching what
 * `createIcons()` would produce at runtime for the given element attrs.
 *
 * @param {string} iconName - kebab-case icon name (e.g. "book-open")
 * @param {Record<string, string>} elementAttrs - attributes from the original <i> tag
 * @returns {string|null} the <svg>...</svg> markup, or null if the icon isn't registered
 */
export function renderLucideIcon(iconName, elementAttrs = {}) {
  const iconNode = ICONS[iconName];
  if (!iconNode) return null;

  const { class: originalClass, ...restAttrs } = elementAttrs;
  const originalClassNames = originalClass ? originalClass.split(/\s+/) : [];

  const ariaProps = hasA11yProp(elementAttrs) ? {} : { "aria-hidden": "true" };

  const svgAttrs = {
    ...defaultAttributes,
    ...ariaProps,
    ...restAttrs,
  };

  const className = mergeClasses("lucide", `lucide-${iconName}`, originalClassNames);
  if (className) svgAttrs.class = className;

  return renderNode(["svg", svgAttrs, iconNode]);
}
