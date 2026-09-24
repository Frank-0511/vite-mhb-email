/**
 * @fileoverview Renderizador de iconos Lucide SVG en tiempo de compilación/desarrollo.
 */

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code,
  Copy,
  Download,
  Eye,
  FileOutput,
  FileText,
  List,
  Monitor,
  Moon,
  MoreHorizontal,
  Package,
  Rocket,
  Save,
  SlidersHorizontal,
  Smartphone,
  Sun,
  X,
  Zap,
  type IconNode,
} from "lucide";

const ICONS: Record<string, IconNode> = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "book-open": BookOpen,
  code: Code,
  copy: Copy,
  download: Download,
  eye: Eye,
  "file-output": FileOutput,
  "file-text": FileText,
  list: List,
  monitor: Monitor,
  moon: Moon,
  "more-horizontal": MoreHorizontal,
  package: Package,
  rocket: Rocket,
  save: Save,
  "sliders-horizontal": SlidersHorizontal,
  smartphone: Smartphone,
  sun: Sun,
  x: X,
  zap: Zap,
};

const defaultAttributes: Record<string, string | number> = {
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

function hasA11yProp(attrs: Record<string, unknown>): boolean {
  return Object.keys(attrs).some(
    (key) => key.startsWith("aria-") || key === "role" || key === "title",
  );
}

function mergeClasses(...classGroups: Array<string | string[] | undefined>): string {
  return classGroups
    .flat()
    .filter((cls): cls is string => typeof cls === "string" && cls.trim() !== "")
    .filter((cls, index, arr) => arr.indexOf(cls) === index)
    .join(" ")
    .trim();
}

function escapeAttr(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type NodeTuple = [tag: string, attrs: Record<string, unknown>, children?: NodeTuple[]];

function renderNode([tag, attrs, children]: NodeTuple): string {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(" ");
  const childrenHtml = (children || []).map((child) => renderNode(child)).join("");
  return `<${tag} ${attrString}>${childrenHtml}</${tag}>`;
}

/**
 * Renderiza un icono Lucide como un string SVG inline estático.
 *
 * @param iconName Nombre del icono en kebab-case (ej. "book-open").
 * @param elementAttrs Atributos del tag <i> original.
 * @returns Markup SVG o null si el icono no está registrado.
 */
export function renderLucideIcon(
  iconName: string,
  elementAttrs: Record<string, string> = {},
): string | null {
  const iconNode = ICONS[iconName];
  if (!iconNode) return null;

  const { class: originalClass, ...restAttrs } = elementAttrs;
  const originalClassNames = originalClass ? originalClass.split(/\s+/) : [];

  const ariaProps = hasA11yProp(elementAttrs) ? {} : { "aria-hidden": "true" };

  const svgAttrs: Record<string, unknown> = {
    ...defaultAttributes,
    ...ariaProps,
    ...restAttrs,
  };

  const className = mergeClasses("lucide", `lucide-${iconName}`, originalClassNames);
  if (className) svgAttrs.class = className;

  return renderNode(["svg", svgAttrs, iconNode]);
}
