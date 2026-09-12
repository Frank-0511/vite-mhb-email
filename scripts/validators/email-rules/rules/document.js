// @ts-check
import { getContext, getLineNumber, Severity } from "../context.js";

export const doctypePresent = {
  id: "doctype-present",
  severity: Severity.ERROR,
  description: "El HTML debe comenzar con <!doctype html>",
  check(html) {
    if (/^<!doctype\s+html\s*>/i.test(html.trim())) return [];
    return [
      {
        ruleId: "doctype-present",
        severity: Severity.ERROR,
        message: "Falta <!doctype html> al inicio del documento",
        hint: "Agregar <!doctype html> como primera línea del HTML",
        line: 1,
      },
    ];
  },
};

export const metaCharset = {
  id: "meta-charset",
  severity: Severity.WARNING,
  description: 'Debe existir <meta charset="utf-8">',
  check(html) {
    if (/meta\s[^>]*charset\s*=\s*["']?utf-?8["']?/i.test(html)) return [];
    return [
      {
        ruleId: "meta-charset",
        severity: Severity.WARNING,
        message:
          'Falta <meta charset="utf-8"> → caracteres especiales (ñ, acentos, emojis) pueden corromperse',
        hint: 'Agregar <meta charset="utf-8"> en el <head>',
      },
    ];
  },
};

export const colorSchemeMeta = {
  id: "color-scheme-meta",
  severity: Severity.INFO,
  description: 'Verificar <meta name="color-scheme"> si hay dark mode',
  check(html) {
    const hasDarkStyles = /prefers-color-scheme\s*:\s*dark/i.test(html) || /\.dark[-_]/i.test(html);
    if (!hasDarkStyles || /meta\s[^>]*name\s*=\s*["']color-scheme["']/i.test(html)) return [];
    return [
      {
        ruleId: "color-scheme-meta",
        severity: Severity.INFO,
        message:
          'Se detectó dark mode CSS pero falta <meta name="color-scheme"> → Apple Mail puede no activar dark mode',
        hint: 'Agregar <meta name="color-scheme" content="light dark"> en el <head>',
      },
    ];
  },
};

export const noJsInEmail = {
  id: "no-js-in-email",
  severity: Severity.ERROR,
  description: "No debe haber <script> tags en el output compilado",
  check(html) {
    const issues = [];
    const scriptRegex = /<script[\s>]/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null)
      issues.push({
        ruleId: "no-js-in-email",
        severity: Severity.ERROR,
        message: "<script> detectado → ningún cliente de email ejecuta JavaScript",
        context: getContext(html, match.index),
        hint: "Eliminar el tag <script>. Si es código de tracking, moverlo al ESP",
        line: getLineNumber(html, match.index),
      });
    return issues;
  },
};
