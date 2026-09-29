/**
 * @fileoverview Generador de iconos PNG a partir de Lucide Icons con @resvg/resvg-js.
 */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { icons } from "lucide";
import { getProjectPaths } from "../shared/index.ts";

export type LucideElementTuple = readonly [string, Record<string, string | number>];

export interface GenerateIconOptions {
  readonly icon: string;
  readonly color: string;
  readonly size: number;
  readonly suffix?: string;
  readonly force?: boolean;
  readonly iconsDir?: string;
}

export interface GeneratedIconResult {
  readonly fileName: string;
  readonly filePath: string;
  readonly width: number;
  readonly height: number;
  readonly pngBuffer: Buffer;
  readonly overwritten: boolean;
}

/**
 * Convierte un nombre en kebab-case a PascalCase para búsqueda en Lucide.
 *
 * @param kebab Nombre en kebab-case (ej: "circle-check").
 * @returns Nombre en PascalCase (ej: "CircleCheck").
 */
export function kebabToPascal(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Valida si un nombre corresponde a un icono existente en Lucide Icons (v1.47.0).
 *
 * @param icon Valor a comprobar.
 * @returns `true` si el icono existe en Lucide.
 */
export function isValidLucideIcon(icon: unknown): icon is string {
  if (typeof icon !== "string" || icon.trim().length === 0) {
    return false;
  }
  const normalized = icon.trim().toLowerCase();
  const pascalName = kebabToPascal(normalized);
  const iconNode = (icons as Record<string, unknown>)[pascalName];
  return Array.isArray(iconNode) && iconNode.length > 0;
}

/**
 * Valida si un color es un hexadecimal de 6 dígitos sin '#'.
 *
 * @param color Valor a comprobar.
 * @returns `true` si es un hex válido de 6 caracteres.
 */
export function isValidHexColor(color: unknown): color is string {
  if (typeof color !== "string") {
    return false;
  }
  return /^[0-9a-fA-F]{6}$/.test(color.trim());
}

/**
 * Valida si un tamaño es un entero positivo en píxeles.
 *
 * @param size Valor a comprobar.
 * @returns `true` si es un entero positivo.
 */
export function isValidIconSize(size: unknown): size is number {
  if (typeof size === "number") {
    return Number.isInteger(size) && size > 0;
  }
  if (typeof size === "string" && /^[1-9]\d*$/.test(size.trim())) {
    const parsed = Number(size.trim());
    return Number.isInteger(parsed) && parsed > 0;
  }
  return false;
}

/**
 * Valida si un sufijo de versión coincide con la convención v<entero positivo> (ej: "v2").
 *
 * @param suffix Valor a comprobar.
 * @returns `true` si es un sufijo de versión válido.
 */
export function isValidIconSuffix(suffix: unknown): suffix is string {
  if (typeof suffix !== "string") {
    return false;
  }
  return /^v[1-9]\d*$/.test(suffix.trim());
}

/**
 * Genera el markup SVG a partir de los nodos de Lucide con color de trazo personalizado.
 *
 * @param iconNode Nodos SVG de Lucide.
 * @param color Código hexadecimal de 6 caracteres sin '#'.
 * @returns String con el documento SVG completo.
 */
export function iconNodeToSvg(iconNode: readonly LucideElementTuple[], color: string): string {
  const children = iconNode
    .map(([tag, attrs]) => {
      const attrStrings = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${attrStrings}/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

/**
 * Genera y escribe un icono PNG @2x optimizado con fondo transparente.
 *
 * @param options Opciones de generación (icono, color, tamaño y force).
 * @returns Metadatos del icono generado y buffer binario.
 */
export function generateIcon(options: GenerateIconOptions): GeneratedIconResult {
  if (!isValidLucideIcon(options.icon)) {
    throw new Error(`El icono "${options.icon}" no existe en Lucide Icons (v1.47.0).`);
  }

  if (!isValidHexColor(options.color)) {
    throw new Error(
      `El color debe ser un valor hexadecimal de 6 dígitos sin '#' (ej: fbbf24). Valor recibido: "${options.color}".`,
    );
  }

  if (!isValidIconSize(options.size)) {
    throw new Error(
      `El tamaño debe ser un entero positivo en píxeles (ej: 24). Valor recibido: "${options.size}".`,
    );
  }

  if (options.suffix !== undefined && !isValidIconSuffix(options.suffix)) {
    throw new Error(
      `El sufijo de versión debe tener el formato "v<entero positivo>" (ej: "v2"). Valor recibido: "${options.suffix}".`,
    );
  }

  const iconName = options.icon.trim().toLowerCase();
  const hexColor = options.color.trim().toLowerCase();
  const htmlSize = Number(options.size);
  const pixelSize = htmlSize * 2;
  const versionSuffix = options.suffix ? `-${options.suffix.trim().toLowerCase()}` : "";

  const fileName = `lucide-${iconName}-${hexColor}${versionSuffix}.png`;
  const targetDir = options.iconsDir ?? getProjectPaths(process.cwd()).iconsRoot;
  const filePath = join(targetDir, fileName);

  const fileExists = existsSync(filePath);
  if (fileExists && !options.force) {
    throw new Error(
      `El archivo "${fileName}" ya existe en "${targetDir}". Los iconos deben ser inmutables por caché de jsDelivr. Si el diseño cambió, cree un archivo nuevo con sufijo de versión (ej: -v2). Para forzar sobrescritura use --force.`,
    );
  }

  const pascalName = kebabToPascal(iconName);
  const iconNode = (icons as Record<string, LucideElementTuple[]>)[pascalName];
  const svgString = iconNodeToSvg(iconNode, hexColor);

  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: pixelSize },
  });

  const rendered = resvg.render();
  const pngBuffer = Buffer.from(rendered.asPng());

  writeFileSync(filePath, pngBuffer);

  return {
    fileName,
    filePath,
    width: rendered.width,
    height: rendered.height,
    pngBuffer,
    overwritten: fileExists,
  };
}
