/**
 * @fileoverview Envía un template buildeado a un inbox de Mailtrap Sandbox
 * usando la API HTTP oficial (sin dependencias externas).
 *
 * Requiere un archivo .env en la raíz del proyecto con:
 *   MAILTRAP_API_TOKEN  — token de API de Mailtrap
 *   MAILTRAP_INBOX_ID   — ID del inbox sandbox
 *   MAILTRAP_FROM_EMAIL — email remitente por defecto (opcional)
 *   MAILTRAP_FROM_NAME  — nombre remitente por defecto (opcional)
 *   MAILTRAP_TO_EMAIL   — email destinatario por defecto (opcional)
 *   MAILTRAP_TO_NAME    — nombre destinatario por defecto (opcional)
 */

import fs from "node:fs";
import path from "node:path";

// ─── Colores ANSI (reusados del CLI) ─────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
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
        "     Copiá .env.example → .env y completá tus credenciales de Mailtrap.\n",
      ),
    );
    process.exit(1);
  }

  // Node >= 20.12 soporta process.loadEnvFile(), usamos fallback manual para compatibilidad
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

/**
 * Muestra una lista numerada y pide al usuario que elija un ítem.
 * @param {import('readline').Interface} rl
 * @param {string[]} items
 * @returns {Promise<string>}  El ítem seleccionado
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

// ─── Listar templates buildeados ─────────────────────────────────────────────

/**
 * @returns {string[]} nombres de archivo (sin ruta)
 */
function getBuiltTemplates() {
  const distDir = path.resolve(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) return [];

  return fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

// ─── Envío a Mailtrap ─────────────────────────────────────────────────────────

/**
 * @param {{ html: string, subject: string, to: string, toName: string, fromEmail: string, fromName: string }} opts
 * @returns {Promise<void>}
 */
async function sendToMailtrap({
  html,
  subject,
  to,
  toName,
  fromEmail,
  fromName,
}) {
  const token = process.env.MAILTRAP_API_TOKEN;
  const inboxId = process.env.MAILTRAP_INBOX_ID;

  if (!token || token === "your_api_token_here") {
    throw new Error("MAILTRAP_API_TOKEN no configurado en .env");
  }
  if (!inboxId || inboxId === "your_inbox_id_here") {
    throw new Error("MAILTRAP_INBOX_ID no configurado en .env");
  }

  const url = `https://sandbox.api.mailtrap.io/api/send/${inboxId}`;

  const body = JSON.stringify({
    from: { email: fromEmail, name: fromName },
    to: [{ email: to, name: toName || to }],
    subject,
    html,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailtrap respondió con ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Flujo principal (exportado para el CLI) ──────────────────────────────────

/**
 * @param {import('readline').Interface} rl  readline heredado del CLI
 * @returns {Promise<void>}
 */
export async function sendTemplate(rl) {
  loadEnv();

  const fromEmailDefault =
    process.env.MAILTRAP_FROM_EMAIL || "no-reply@example.com";
  const fromNameDefault = process.env.MAILTRAP_FROM_NAME || "vite-mhb-email";
  const toEmailDefault = process.env.MAILTRAP_TO_EMAIL || "";
  const toNameDefault = process.env.MAILTRAP_TO_NAME || "";

  console.log(paint(c.magenta + c.bold, "\n  📨 Enviar template a Mailtrap\n"));

  // 1. Listar templates disponibles en dist/
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

  console.log(paint(c.bold, "  Templates disponibles:\n"));
  const chosen = await pickFromList(rl, templates);
  const html = fs.readFileSync(
    path.resolve(process.cwd(), "dist", chosen),
    "utf-8",
  );

  // 2. Datos del envío
  console.log();
  const to = await prompt(rl, "Destinatario (email)", toEmailDefault);
  if (!to) {
    console.log(
      paint(c.red, "\n  ❌ El email del destinatario es obligatorio.\n"),
    );
    return;
  }
  const toName = await prompt(rl, "Nombre del destinatario", toNameDefault);
  const fromEmail = await prompt(rl, "Remitente (email)", fromEmailDefault);
  const fromName = await prompt(rl, "Nombre del remitente", fromNameDefault);
  const subject = await prompt(
    rl,
    "Asunto del email",
    `[Test] ${chosen.replace(".html", "")}`,
  );

  // 3. Confirmar y enviar
  console.log();
  console.log(paint(c.bold, "  Resumen del envío:"));
  console.log(`  ${paint(c.dim, "De:")}      ${fromName} <${fromEmail}>`);
  console.log(`  ${paint(c.dim, "Para:")}    ${toName || to} <${to}>`);
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

  console.log(paint(c.dim, "\n  Enviando…"));

  try {
    await sendToMailtrap({ html, subject, to, toName, fromEmail, fromName });
    console.log(
      paint(c.green + c.bold, `\n  ✅ Email enviado exitosamente a ${to}`),
    );
    console.log(paint(c.dim, "     Revisá tu inbox en https://mailtrap.io\n"));
  } catch (err) {
    console.log(
      paint(c.red + c.bold, `\n  ❌ Error al enviar: ${err.message}\n`),
    );
  }
}
