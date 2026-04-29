/**
 * @fileoverview Componentes de UI para el CLI.
 * Pantalla, menú, banner, ayuda y validación de .env
 */

import { c, checkEnv, paint } from "../utils.js";

/** @param {string} text @returns {string} */
const bold = (text) => paint(c.bold, text);
/** @param {string} text @returns {string} */
const dim = (text) => paint(c.dim, text);

/**
 * Limpia la pantalla del terminal.
 */
export function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

/**
 * Muestra el banner principal del CLI.
 */
export function printBanner() {
  console.log(
    [
      "",
      paint(c.cyan + c.bold, "  ╔══════════════════════════════════╗"),
      paint(c.cyan + c.bold, "  ║     vite-mhb-email  CLI  🚀      ║"),
      paint(c.cyan + c.bold, "  ╚══════════════════════════════════╝"),
      "",
    ].join("\n"),
  );
}

/**
 * Muestra el menú principal con todas las opciones disponibles.
 */
export function printMenu() {
  const options = [
    { key: "1", icon: "⚡", label: "Levantar servidor local", color: c.green },
    { key: "2", icon: "📦", label: "Buildear para producción", color: c.yellow },
    { key: "3", icon: "✨", label: "Crear nuevo template", color: c.magenta },
    { key: "4", icon: "📨", label: "Enviar template a Mailtrap", color: c.blue },
    { key: "5", icon: "🧪", label: "Testear con Mail-Tester (Gmail)", color: c.cyan },
    {
      key: "6",
      icon: "📬",
      label: "Enviar a bandeja real (Gmail / Outlook / Apple)",
      color: c.magenta,
    },
    { key: "7", icon: "📸", label: "Exportar template como PNG", color: c.green },
    { key: "8", icon: "🔍", label: "Validar compatibilidad email", color: c.cyan },
    { key: "0", icon: "👋", label: "Salir", color: c.red },
  ];

  console.log(paint(c.white + c.bold, "  Seleccioná una opción:\n"));
  for (const opt of options) {
    const key = paint(opt.color + c.bold, ` [${opt.key}] `);
    const label = paint(opt.color, `${opt.icon}  ${opt.label}`);
    console.log(`  ${key} ${label}`);
  }
  console.log();
}

/**
 * Muestra la pantalla de ayuda.
 */
export function printHelp() {
  console.log(`
${paint(c.cyan + c.bold, "  vite-mhb-email CLI")}

  ${bold("Uso:")}
    yarn cli          Abre el menú interactivo
    yarn cli --help   Muestra esta ayuda

  ${bold("Opciones del menú:")}
    ${paint(c.green, "[1]")}  ⚡  Levantar servidor de desarrollo  (yarn dev)
    ${paint(c.yellow, "[2]")}  📦  Buildear para producción          (yarn build)
    ${paint(c.magenta, "[3]")}  ✨  Crear nuevo template
    ${paint(c.blue, "[4]")}  📨  Enviar template a Mailtrap        (requiere MAILTRAP_*)
    ${paint(c.cyan, "[5]")}  🧪  Testear con Mail-Tester (Gmail)   (requiere GMAIL_*)
    ${paint(c.magenta, "[6]")}  📬  Enviar a bandeja real             (requiere GMAIL_*)
    ${paint(c.green, "[7]")}  📸  Exportar template como PNG
    ${paint(c.cyan, "[8]")}  🔍  Validar compatibilidad email
    ${paint(c.red, "[0]")}  👋  Salir

  ${bold("Variables de entorno:")}
    Copiá ${dim(".env.example")} → ${dim(".env")} y completá tus credenciales.
    Ver README para la referencia completa de variables.
`);
}

/**
 * Verifica el estado del .env y muestra advertencias si faltan variables.
 * No termina el proceso — solo informa al usuario.
 */
export function warnMissingEnv() {
  const ALL_KEYS = ["MAILTRAP_API_TOKEN", "MAILTRAP_INBOX_ID", "GMAIL_USER", "GMAIL_APP_PASS"];

  const { exists, missing } = checkEnv(ALL_KEYS);

  if (!exists) {
    console.log(
      paint(c.yellow + c.bold, "  ⚠️  No se encontró el archivo .env.") +
        paint(c.dim, "  Las opciones de envío (4, 5, 6) no estarán disponibles.\n") +
        paint(c.dim, "     Copiá .env.example → .env y completá tus credenciales.\n"),
    );
    return;
  }

  if (missing.length > 0) {
    const groups = {
      "Mailtrap (opción 4)": ["MAILTRAP_API_TOKEN", "MAILTRAP_INBOX_ID"],
      "Gmail SMTP (opciones 5 y 6)": ["GMAIL_USER", "GMAIL_APP_PASS"],
    };

    const affectedGroups = Object.entries(groups)
      .filter(([, keys]) => keys.some((k) => missing.includes(k)))
      .map(([name]) => name);

    if (affectedGroups.length > 0) {
      console.log(paint(c.yellow + c.bold, "  ⚠️  Variables de .env sin configurar:"));
      for (const g of affectedGroups) {
        console.log(paint(c.dim, `     • ${g}`));
      }
      console.log(paint(c.dim, "     Ver README → Variables de entorno para más info.\n"));
    }
  }
}
