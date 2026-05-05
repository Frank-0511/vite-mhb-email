#!/usr/bin/env node
/**
 * @fileoverview Validador de compatibilidad HTML para clientes de email.
 * Analiza los templates compilados en dist/ y reporta problemas
 * de compatibilidad con Outlook, Gmail, Apple Mail, Yahoo, etc.
 *
 * Uso:
 *   bun run validate-email       # Valida todos los templates en dist/
 *   node scripts/build/validate-email-html.js   # Ídem
 *
 * También se importa desde build.js para ejecutarse como paso post-build.
 */

import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "node:path";

// ─── Colores ANSI ─────────────────────────────────────────────────────────────

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

/** @param {string} color @param {string} text */
const paint = (color, text) => `${color}${text}${colors.reset}`;

// ─── Severidades ──────────────────────────────────────────────────────────────

/** @enum {string} */
const Severity = {
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
};

const SEVERITY_ICON = {
  [Severity.ERROR]: "❌",
  [Severity.WARNING]: "⚠️",
  [Severity.INFO]: "ℹ️",
};

const SEVERITY_COLOR = {
  [Severity.ERROR]: colors.red,
  [Severity.WARNING]: colors.yellow,
  [Severity.INFO]: colors.blue,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Issue
 * @property {string} ruleId
 * @property {string} severity
 * @property {string} message
 * @property {string} [context] - Fragmento del HTML problemático
 * @property {string} [hint] - Sugerencia de corrección
 * @property {number} [line] - Número de línea aproximado
 */

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {string} severity
 * @property {string} description
 * @property {(html: string, filePath: string) => Issue[]} check
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el número de línea aproximado de un índice en el string.
 * @param {string} html
 * @param {number} index
 * @returns {number}
 */
function getLineNumber(html, index) {
  return html.substring(0, index).split("\n").length;
}

/**
 * Extrae un fragmento de contexto limpio alrededor de un match.
 * @param {string} html
 * @param {number} index
 * @param {number} [length=80]
 * @returns {string}
 */
function getContext(html, index, length = 100) {
  const start = Math.max(0, index);
  const end = Math.min(html.length, start + length);
  let snippet = html.substring(start, end).replace(/\s+/g, " ").trim();
  if (end < html.length) snippet += "…";
  return snippet;
}

/**
 * Extrae todo el contenido de las etiquetas <style> de un HTML.
 * @param {string} html
 * @returns {string}
 */
function extractStyleContent(html) {
  const styleBlocks = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    styleBlocks.push(match[1]);
  }
  return styleBlocks.join("\n");
}

// ─── Reglas de validación ─────────────────────────────────────────────────────

/** @type {Rule[]} */
const rules = [
  // ── 1. img-dimensions ─────────────────────────────────────────────────────
  {
    id: "img-dimensions",
    severity: Severity.ERROR,
    description: "Toda <img> debe tener width y height como atributos HTML",
    check(html) {
      const issues = [];
      const imgRegex = /<img\s[^>]*?>/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const tag = match[0];
        const hasWidth = /\bwidth\s*=\s*["']/i.test(tag);
        const hasHeight = /\bheight\s*=\s*["']/i.test(tag);
        if (!hasWidth || !hasHeight) {
          const missing = [];
          if (!hasWidth) missing.push("width");
          if (!hasHeight) missing.push("height");
          issues.push({
            ruleId: "img-dimensions",
            severity: Severity.ERROR,
            message: `<img> sin atributo ${missing.join(" ni ")} → Outlook puede distorsionar`,
            context: getContext(html, match.index),
            hint: `Agregar ${missing.join(" y ")} como atributos HTML`,
            line: getLineNumber(html, match.index),
          });
        }
      }
      return issues;
    },
  },

  // ── 2. img-alt ────────────────────────────────────────────────────────────
  {
    id: "img-alt",
    severity: Severity.WARNING,
    description: "Toda <img> debe tener alt no vacío",
    check(html) {
      const issues = [];
      const imgRegex = /<img\s[^>]*?>/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const tag = match[0];
        const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
        if (!altMatch) {
          issues.push({
            ruleId: "img-alt",
            severity: Severity.WARNING,
            message: "<img> sin atributo alt → usuarios con imágenes bloqueadas no verán contexto",
            context: getContext(html, match.index),
            hint: 'Agregar alt="descripción de la imagen"',
            line: getLineNumber(html, match.index),
          });
        } else if (altMatch[1].trim() === "") {
          issues.push({
            ruleId: "img-alt",
            severity: Severity.WARNING,
            message: '<img> con alt vacío (alt="")',
            context: getContext(html, match.index),
            hint: "Agregar un texto descriptivo al atributo alt",
            line: getLineNumber(html, match.index),
          });
        }
      }
      return issues;
    },
  },

  // ── 3. css-unsupported-props ──────────────────────────────────────────────
  {
    id: "css-unsupported-props",
    severity: Severity.ERROR,
    description: "Detecta propiedades CSS no soportadas en clientes de email",
    check(html) {
      const issues = [];
      const styleContent = extractStyleContent(html);
      if (!styleContent) return issues;

      // Propiedades CSS problemáticas y sus clientes afectados
      const unsupportedProps = [
        {
          prop: "display:\\s*flex",
          name: "display: flex",
          clients: "Outlook (todas las versiones)",
        },
        { prop: "display:\\s*grid", name: "display: grid", clients: "Outlook, Gmail (parcial)" },
        {
          prop: "(?<!\\-)position\\s*:\\s*(?:absolute|fixed|sticky)",
          name: "position: absolute/fixed/sticky",
          clients: "Outlook, Gmail",
        },
        { prop: "(?<!\\-)float\\s*:", name: "float", clients: "Outlook (Word rendering engine)" },
        {
          prop: "(?:^|[{;\\s])gap\\s*:",
          name: "gap",
          clients: "Outlook, Gmail, Yahoo (sin soporte flex/grid)",
        },
        {
          prop: "(?<!\\-)opacity\\s*:",
          name: "opacity",
          clients: "Outlook (versiones de escritorio)",
        },
        {
          prop: "(?<!\\-)transform\\s*:",
          name: "transform",
          clients: "Outlook (todas las versiones)",
        },
        {
          prop: "(?<!\\-)animation\\s*:",
          name: "animation",
          clients: "Outlook, Gmail (eliminan animaciones)",
        },
        {
          prop: "(?<!\\-)transition\\s*:",
          name: "transition",
          clients: "Outlook, Gmail",
        },
      ];

      // Funciones CSS no soportadas
      const unsupportedFunctions = [
        { func: "calc\\s*\\(", name: "calc()", clients: "Outlook" },
        { func: "var\\s*\\(", name: "var() (CSS custom properties)", clients: "Outlook, Gmail" },
        { func: "clamp\\s*\\(", name: "clamp()", clients: "Outlook, Gmail, Yahoo" },
      ];

      for (const { prop, name, clients } of unsupportedProps) {
        const regex = new RegExp(prop, "gi");
        if (regex.test(styleContent)) {
          issues.push({
            ruleId: "css-unsupported-props",
            severity: Severity.ERROR,
            message: `Propiedad CSS "${name}" no soportada en: ${clients}`,
            hint: `Reemplazar con alternativa compatible (ej: flex → table layout)`,
          });
        }
      }

      for (const { func, name, clients } of unsupportedFunctions) {
        const regex = new RegExp(func, "gi");
        if (regex.test(styleContent)) {
          issues.push({
            ruleId: "css-unsupported-props",
            severity: Severity.ERROR,
            message: `Función CSS "${name}" no soportada en: ${clients}`,
            hint: "Usar valores estáticos en lugar de funciones CSS dinámicas",
          });
        }
      }

      return issues;
    },
  },

  // ── 4. doctype-present ────────────────────────────────────────────────────
  {
    id: "doctype-present",
    severity: Severity.ERROR,
    description: "El HTML debe comenzar con <!doctype html>",
    check(html) {
      const trimmed = html.trim();
      if (!/^<!doctype\s+html\s*>/i.test(trimmed)) {
        return [
          {
            ruleId: "doctype-present",
            severity: Severity.ERROR,
            message: "Falta <!doctype html> al inicio del documento",
            hint: "Agregar <!doctype html> como primera línea del HTML",
            line: 1,
          },
        ];
      }
      return [];
    },
  },

  // ── 5. meta-charset ───────────────────────────────────────────────────────
  {
    id: "meta-charset",
    severity: Severity.WARNING,
    description: 'Debe existir <meta charset="utf-8">',
    check(html) {
      if (!/meta\s[^>]*charset\s*=\s*["']?utf-?8["']?/i.test(html)) {
        return [
          {
            ruleId: "meta-charset",
            severity: Severity.WARNING,
            message:
              'Falta <meta charset="utf-8"> → caracteres especiales (ñ, acentos, emojis) pueden corromperse',
            hint: 'Agregar <meta charset="utf-8"> en el <head>',
          },
        ];
      }
      return [];
    },
  },

  // ── 6. link-targets ───────────────────────────────────────────────────────
  {
    id: "link-targets",
    severity: Severity.WARNING,
    description: "Todo <a href> debe tener un URL válido (no # ni vacío)",
    check(html) {
      const issues = [];
      const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1].trim();
        // Ignorar placeholders de ESP ({{ }}, *| |*, etc.)
        if (/\{\{.*\}\}/.test(href) || /\*\|.*\|\*/.test(href)) continue;
        // Ignorar mailto:
        if (/^mailto:/i.test(href)) continue;

        if (href === "#" || href === "") {
          issues.push({
            ruleId: "link-targets",
            severity: Severity.WARNING,
            message: `<a> con href="${href || "(vacío)"}" → link roto en producción`,
            context: getContext(html, match.index),
            hint: "Reemplazar con la URL real o con un placeholder ESP {{ url }}",
            line: getLineNumber(html, match.index),
          });
        }
      }
      return issues;
    },
  },

  // ── 7. max-width-check ────────────────────────────────────────────────────
  {
    id: "max-width-check",
    severity: Severity.WARNING,
    description: "La tabla principal debería tener max-width ≤ 700px",
    check(html) {
      const styleContent = extractStyleContent(html);
      // Buscar max-width en el CSS
      const maxWidthMatch = styleContent.match(/\.max-w-[^\s{]*\{[^}]*max-width\s*:\s*([^;}]+)/i);
      if (maxWidthMatch) {
        const value = maxWidthMatch[1].trim();
        // Parsear rem (1rem = 16px)
        const remMatch = value.match(/([\d.]+)\s*rem/);
        if (remMatch) {
          const px = parseFloat(remMatch[1]) * 16;
          if (px > 700) {
            return [
              {
                ruleId: "max-width-check",
                severity: Severity.WARNING,
                message: `max-width del email es ${px}px (${value}) → mayor a 700px puede cortarse en mobile`,
                hint: "Considerar reducir el ancho máximo a 600-700px",
              },
            ];
          }
        }
        // Parsear px directamente
        const pxMatch = value.match(/([\d.]+)\s*px/);
        if (pxMatch && parseFloat(pxMatch[1]) > 700) {
          return [
            {
              ruleId: "max-width-check",
              severity: Severity.WARNING,
              message: `max-width del email es ${value} → mayor a 700px puede cortarse en mobile`,
              hint: "Considerar reducir el ancho máximo a 600-700px",
            },
          ];
        }
      }
      return [];
    },
  },

  // ── 8. color-scheme-meta ──────────────────────────────────────────────────
  {
    id: "color-scheme-meta",
    severity: Severity.INFO,
    description: 'Verificar <meta name="color-scheme"> si hay dark mode',
    check(html) {
      const hasDarkStyles =
        /prefers-color-scheme\s*:\s*dark/i.test(html) || /\.dark[-_]/i.test(html);
      if (!hasDarkStyles) return [];

      if (!/meta\s[^>]*name\s*=\s*["']color-scheme["']/i.test(html)) {
        return [
          {
            ruleId: "color-scheme-meta",
            severity: Severity.INFO,
            message:
              'Se detectó dark mode CSS pero falta <meta name="color-scheme"> → Apple Mail puede no activar dark mode',
            hint: 'Agregar <meta name="color-scheme" content="light dark"> en el <head>',
          },
        ];
      }
      return [];
    },
  },

  // ── 9. unsubscribe-link ───────────────────────────────────────────────────
  {
    id: "unsubscribe-link",
    severity: Severity.WARNING,
    description: "El email debe contener un link de cancelar suscripción",
    check(html) {
      const lowerHtml = html.toLowerCase();
      const hasUnsub =
        lowerHtml.includes("unsubscribe") ||
        lowerHtml.includes("cancelar suscripción") ||
        lowerHtml.includes("cancelar suscripcion") ||
        lowerHtml.includes("darse de baja") ||
        lowerHtml.includes("unsub");
      if (!hasUnsub) {
        return [
          {
            ruleId: "unsubscribe-link",
            severity: Severity.WARNING,
            message: "No se encontró link de cancelar suscripción → requerido por CAN-SPAM y GDPR",
            hint: 'Agregar un link de unsubscribe en el footer (ej: <a href="{{ unsubscribe_url }}">Cancelar suscripción</a>)',
          },
        ];
      }
      return [];
    },
  },

  // ── 10. no-js-in-email ────────────────────────────────────────────────────
  {
    id: "no-js-in-email",
    severity: Severity.ERROR,
    description: "No debe haber <script> tags en el output compilado",
    check(html) {
      const issues = [];
      const scriptRegex = /<script[\s>]/gi;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        issues.push({
          ruleId: "no-js-in-email",
          severity: Severity.ERROR,
          message: "<script> detectado → ningún cliente de email ejecuta JavaScript",
          context: getContext(html, match.index),
          hint: "Eliminar el tag <script>. Si es código de tracking, moverlo al ESP",
          line: getLineNumber(html, match.index),
        });
      }
      return issues;
    },
  },

  // ── 11. nested-tables-depth ───────────────────────────────────────────────
  {
    id: "nested-tables-depth",
    severity: Severity.INFO,
    description: "Advertir si hay tablas anidadas a más de 4 niveles",
    check(html) {
      let maxDepth = 0;
      let currentDepth = 0;
      const tableOpenRegex = /<table[\s>]/gi;
      const tableCloseRegex = /<\/table>/gi;

      // Recorrer el HTML carácter por carácter con regex positions
      const opens = [];
      const closes = [];
      let m;
      while ((m = tableOpenRegex.exec(html)) !== null) opens.push(m.index);
      while ((m = tableCloseRegex.exec(html)) !== null) closes.push(m.index);

      // Merge y recorrer en orden de posición
      const events = [
        ...opens.map((i) => ({ pos: i, type: "open" })),
        ...closes.map((i) => ({ pos: i, type: "close" })),
      ].sort((a, b) => a.pos - b.pos);

      for (const event of events) {
        if (event.type === "open") {
          currentDepth++;
          if (currentDepth > maxDepth) maxDepth = currentDepth;
        } else {
          currentDepth--;
        }
      }

      if (maxDepth > 4) {
        return [
          {
            ruleId: "nested-tables-depth",
            severity: Severity.INFO,
            message: `Tablas anidadas a ${maxDepth} niveles → Outlook puede corromper layouts con nesting excesivo`,
            hint: "Intentar reducir la profundidad de anidamiento a 4 niveles o menos",
          },
        ];
      }
      return [];
    },
  },

  // ── 12. css-class-vs-inline ───────────────────────────────────────────────
  {
    id: "css-class-vs-inline",
    severity: Severity.INFO,
    description: "Reportar ratio de estilos en clase vs inline",
    check(html) {
      const styleContent = extractStyleContent(html);
      // Contar reglas CSS en <style> (aproximado por número de {)
      const cssRuleCount = (styleContent.match(/\{/g) || []).length;

      // Contar elementos con style="" inline
      const inlineStyleCount = (html.match(/\bstyle\s*=\s*["'][^"']+["']/gi) || []).length;

      if (cssRuleCount > 0 && inlineStyleCount === 0) {
        return [
          {
            ruleId: "css-class-vs-inline",
            severity: Severity.INFO,
            message: `${cssRuleCount} reglas CSS en <style>, 0 estilos inline → Gmail elimina <style> del <head>`,
            hint: "Considerar CSS inlining (Maizzle lo hace con css.inline: true en la config)",
          },
        ];
      }

      // Solo reportar si hay un desbalance significativo
      if (cssRuleCount > 20 && inlineStyleCount < 5) {
        return [
          {
            ruleId: "css-class-vs-inline",
            severity: Severity.INFO,
            message: `${cssRuleCount} reglas CSS en <style>, ${inlineStyleCount} estilos inline`,
            hint: "Gmail elimina <style> del <head>. Considerar CSS inlining para mayor compatibilidad",
          },
        ];
      }

      return [];
    },
  },
];

// ─── Motor de validación ──────────────────────────────────────────────────────

/**
 * Valida un archivo HTML con todas las reglas.
 * @param {string} filePath
 * @returns {{ file: string, issues: Issue[] }}
 */
function validateFile(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const fileName = filePath.split("/").pop();
  const allIssues = [];

  for (const rule of rules) {
    try {
      const issues = rule.check(html, filePath);
      allIssues.push(...issues);
    } catch (err) {
      console.error(
        paint(colors.red, `  Error ejecutando regla "${rule.id}" en ${fileName}: ${err.message}`),
      );
    }
  }

  return { file: fileName, issues: allIssues };
}

// ─── Formateo de salida ───────────────────────────────────────────────────────

/**
 * Imprime el reporte de validación para un archivo.
 * @param {{ file: string, issues: Issue[] }} result
 */
function printFileReport(result) {
  const { file, issues } = result;
  console.log(paint(colors.bold + colors.white, `\n📋 Email Compatibility Report: ${file}\n`));

  if (issues.length === 0) {
    console.log(paint(colors.green + colors.bold, "  ✅ No se encontraron problemas!\n"));
    return;
  }

  for (const issue of issues) {
    const icon = SEVERITY_ICON[issue.severity];
    const color = SEVERITY_COLOR[issue.severity];
    const lineInfo = issue.line ? paint(colors.dim, `L${issue.line}: `) : "";

    console.log(
      `  ${icon} ${paint(color + colors.bold, `[${issue.ruleId}]`)}  ${lineInfo}${issue.message}`,
    );

    if (issue.context) {
      console.log(paint(colors.dim, `     → ${issue.context}`));
    }
    if (issue.hint) {
      console.log(paint(colors.cyan, `     💡 ${issue.hint}`));
    }
    console.log();
  }

  // Resumen del archivo
  const errors = issues.filter((i) => i.severity === Severity.ERROR).length;
  const warnings = issues.filter((i) => i.severity === Severity.WARNING).length;
  const infos = issues.filter((i) => i.severity === Severity.INFO).length;
  const passed = rules.length - new Set(issues.map((i) => i.ruleId)).size;

  console.log(paint(colors.dim, "  ─────────────────────────────────────────"));
  console.log(
    `  ${paint(colors.green, `✅ ${passed} reglas OK`)}  │  ` +
      `${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}  │  ` +
      `${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ` +
      `${paint(colors.blue, `ℹ️  ${infos} info`)}`,
  );
}

/**
 * Imprime el resumen global de todos los archivos.
 * @param {{ file: string, issues: Issue[] }[]} results
 */
function printSummary(results) {
  const totalIssues = results.flatMap((r) => r.issues);
  const totalErrors = totalIssues.filter((i) => i.severity === Severity.ERROR).length;
  const totalWarnings = totalIssues.filter((i) => i.severity === Severity.WARNING).length;
  const totalInfos = totalIssues.filter((i) => i.severity === Severity.INFO).length;

  console.log(paint(colors.bold + colors.white, `\n══════════════════════════════════════════`));
  console.log(
    paint(
      colors.bold + colors.white,
      `📊 Resumen total: ${results.length} archivo${results.length !== 1 ? "s" : ""} analizado${results.length !== 1 ? "s" : ""}`,
    ),
  );
  console.log(
    `   ${paint(colors.red, `❌ ${totalErrors} error${totalErrors !== 1 ? "es" : ""}`)}  │  ` +
      `${paint(colors.yellow, `⚠️  ${totalWarnings} warning${totalWarnings !== 1 ? "s" : ""}`)}  │  ` +
      `${paint(colors.blue, `ℹ️  ${totalInfos} info`)}`,
  );

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(
      paint(colors.green + colors.bold, "\n✅ Todos los templates son compatibles con email!\n"),
    );
  } else {
    console.log();
  }
}

// ─── Función principal exportable ─────────────────────────────────────────────

/**
 * Valida todos los archivos HTML en dist/ y muestra el reporte.
 * @returns {boolean} `true` si hay errores o warnings
 */
export function validateEmailHtml() {
  const rootDir = process.cwd();
  const distDir = resolve(rootDir, "dist");
  const htmlFiles = globSync("**/*.html", { cwd: distDir });

  if (htmlFiles.length === 0) {
    console.log("\n⚠️  No HTML files found in dist/\n");
    return false;
  }

  console.log(paint(colors.cyan + colors.bold, "🔍 Validando compatibilidad email...\n"));

  const results = htmlFiles.map((file) => validateFile(resolve(distDir, file)));

  for (const result of results) {
    printFileReport(result);
  }

  printSummary(results);

  const hasIssues = results.some((r) =>
    r.issues.some((i) => i.severity === Severity.ERROR || i.severity === Severity.WARNING),
  );
  return hasIssues;
}

// ─── Ejecución directa ───────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  validateEmailHtml();
}
