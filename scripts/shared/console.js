// @ts-check
/**
 * @fileoverview Códigos de color ANSI para terminal y utilidades de pintado de texto.
 */

/** @type {Object<string, string>} */
export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
};

/**
 * Pinta texto con un código ANSI de color.
 * @param {string} color - Código ANSI (ej. c.red, c.green)
 * @param {string} text - Texto a colorear
 * @returns {string} Texto coloreado
 */
export const paint = (color, text) => `${color}${text}${c.reset}`;
