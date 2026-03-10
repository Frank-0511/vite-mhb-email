/**
 * @fileoverview Envía un template buildeado a mail-tester.com vía Gmail SMTP.
 * Usa nodemailer con las credenciales de Gmail configuradas en .env.
 *
 * Requiere en .env:
 *   GMAIL_USER       — tu dirección de Gmail (ej. tu@gmail.com)
 *   GMAIL_APP_PASS   — App Password de Google (no la contraseña normal)
 *                      Obtenerla en: myaccount.google.com/apppasswords
 *   SMTP_FROM_NAME   — nombre remitente por defecto (opcional)
 */

import fs from "node:fs";
import path from "node:path";
import { createTransport } from "nodemailer";

// ─── Colores ANSI ─────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
};
const paint = (color, text) => `${color}${text}${c.reset}`;

// ─── Cargar .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error(
      paint(
        c.red + c.bold,
        "\n  ❌ No se encontró el archivo .env en la raíz del proyecto.",
      ),
    );
    console.error(
      paint(
        c.dim,
        "     Copiá .env.example → .env y completá tus credenciales de Gmail.\n",
      ),
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// ─── Helpers de prompt ───────────────────────────────────────────────────────

/**
 * @param {import('readline').Interface} rl
 * @param {string} question
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
function prompt(rl, question, defaultValue = "") {
  const hint = defaultValue ? paint(c.dim, ` (${defaultValue})`) : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${hint}: `, (answer) => {
      const val = answer.trim();
      resolve(val !== "" ? val : defaultValue);
    });
  });
}

// ─── Listar templates buildeados ─────────────────────────────────────────────

/** @returns {string[]} */
function getBuiltTemplates() {
  const distDir = path.resolve(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) return [];
  return fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

// ─── Elegir de una lista ──────────────────────────────────────────────────────

/**
 * @param {import('readline').Interface} rl
 * @param {string[]} items
 * @returns {Promise<string>}
 */
async function pickFromList(rl, items) {
  items.forEach((item, i) => {
    console.log(
      `  ${paint(c.cyan + c.bold, `[${i + 1}]`)} ${paint(c.cyan, item)}`,
    );
  });
  console.log();

  while (true) {
    const raw = await prompt(rl, paint(c.cyan + c.bold, "→ Elegí un número"));
    const idx = parseInt(raw, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < items.length) return items[idx];
    console.log(
      paint(
        c.red,
        `  ❌ Opción inválida. Ingresá un número entre 1 y ${items.length}.`,
      ),
    );
  }
}

// ─── Envío vía Gmail SMTP ─────────────────────────────────────────────────────

/**
 * @param {{ html: string, subject: string, to: string, fromEmail: string, fromName: string }} opts
 * @returns {Promise<void>}
 */
async function sendViaGmail({ html, subject, to, fromEmail, fromName }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;

  if (!user || user === "tu@gmail.com") {
    throw new Error("GMAIL_USER no configurado en .env");
  }
  if (!pass || pass === "xxxx xxxx xxxx xxxx") {
    throw new Error("GMAIL_APP_PASS no configurado en .env");
  }

  const transporter = createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
}

// ─── Flujo principal (exportado para el CLI) ──────────────────────────────────

/**
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function sendToMailtester(rl) {
  loadEnv();

  const fromEmailDefault = process.env.GMAIL_USER || "";
  const fromNameDefault = process.env.SMTP_FROM_NAME || "vite-mhb-email";
  const mailtesterDefault = process.env.MAILTESTER_TO_EMAIL || "";

  console.log(paint(c.blue + c.bold, "\n  🧪 Testear template con Mail-Tester\n"));
  console.log(
    paint(c.dim, "  1. Andá a https://mail-tester.com"),
  );
  console.log(
    paint(c.dim, "  2. Copiá la dirección única que te dan (ej. test-xyz123@mail-tester.com)"),
  );
  console.log(
    paint(c.dim, "  3. Pegala aquí abajo y enviamos el template.\n"),
  );

  // 1. Dirección de mail-tester
  const mailtesterAddr = await prompt(rl, "Dirección de mail-tester.com", mailtesterDefault);
  if (!mailtesterAddr || !mailtesterAddr.includes("mail-tester.com")) {
    console.log(
      paint(
        c.red,
        "\n  ❌ Ingresá una dirección válida de mail-tester.com (ej. test-xxx@mail-tester.com).\n",
      ),
    );
    return;
  }

  // 2. Template
  const templates = getBuiltTemplates();
  if (templates.length === 0) {
    console.log(paint(c.yellow, "  ⚠️  No hay templates buildeados en dist/."));
    console.log(
      paint(
        c.dim,
        "     Ejecutá primero la opción [2] para buildear para producción.\n",
      ),
    );
    return;
  }

  console.log(paint(c.bold, "\n  Templates disponibles:\n"));
  const chosen = await pickFromList(rl, templates);
  const html = fs.readFileSync(
    path.resolve(process.cwd(), "dist", chosen),
    "utf-8",
  );

  // 3. Remitente y asunto
  console.log();
  const fromEmail = await prompt(rl, "Remitente (tu Gmail)", fromEmailDefault);
  if (!fromEmail) {
    console.log(paint(c.red, "\n  ❌ El email del remitente es obligatorio.\n"));
    return;
  }
  const fromName = await prompt(rl, "Nombre del remitente", fromNameDefault);
  const subject = await prompt(
    rl,
    "Asunto del email",
    `[Test] ${chosen.replace(".html", "")}`,
  );

  // 4. Resumen y confirmación
  console.log();
  console.log(paint(c.bold, "  Resumen del envío:"));
  console.log(`  ${paint(c.dim, "De:")}      ${fromName} <${fromEmail}>`);
  console.log(`  ${paint(c.dim, "Para:")}    ${mailtesterAddr}`);
  console.log(`  ${paint(c.dim, "Asunto:")}  ${subject}`);
  console.log(`  ${paint(c.dim, "Template:")} ${chosen}`);
  console.log();

  const confirm = await prompt(
    rl,
    paint(c.yellow + c.bold, "¿Confirmar envío? (s/N)"),
    "N",
  );
  if (!["s", "S", "y", "Y"].includes(confirm)) {
    console.log(paint(c.yellow, "\n  ⚠️  Envío cancelado.\n"));
    return;
  }

  console.log(paint(c.dim, "\n  Enviando vía Gmail SMTP…"));

  try {
    await sendViaGmail({ html, subject, to: mailtesterAddr, fromEmail, fromName });

    // Extraer el prefijo para armar la URL de resultados
    const prefix = mailtesterAddr.split("@")[0];
    const resultUrl = `https://www.mail-tester.com/${prefix}`;

    console.log(
      paint(c.green + c.bold, "\n  ✅ Email enviado exitosamente a Mail-Tester"),
    );
    console.log(paint(c.bold, `\n  🔗 Revisá tu score en:`));
    console.log(`     ${paint(c.cyan + c.bold, resultUrl)}\n`);
  } catch (err) {
    console.log(
      paint(c.red + c.bold, `\n  ❌ Error al enviar: ${err.message}\n`),
    );
    if (err.message.includes("Invalid login")) {
      console.log(
        paint(
          c.dim,
          "     Asegurate de usar un App Password de Google (no tu contraseña normal).\n" +
          "     Generalo en: https://myaccount.google.com/apppasswords\n",
        ),
      );
    }
  }
}
