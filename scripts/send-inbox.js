/**
 * @fileoverview Envía un template buildeado a bandejas reales para validación en vivo.
 * Soporta Gmail, Outlook y Apple Mail (iCloud) vía Gmail SMTP.
 *
 * Variables requeridas en .env:
 *   GMAIL_USER          — cuenta de Gmail remitente
 *   GMAIL_APP_PASS      — App Password de Google
 *   SMTP_FROM_NAME      — nombre remitente por defecto
 *   TEST_GMAIL_TO       — destinatario por defecto para Gmail
 *   TEST_OUTLOOK_TO     — destinatario por defecto para Outlook
 *   TEST_APPLE_TO       — destinatario por defecto para Apple Mail
 */

import {
  c,
  paint,
  loadEnv,
  prompt,
  pickFromList,
  getBuiltTemplates,
  readBuiltTemplate,
} from "./utils.js";
import { sendViaGmail } from "./gmail-transport.js";
import { buildIfNeeded } from "./build-helper.js";

// ─── Proveedores disponibles ──────────────────────────────────────────────────

const PROVIDERS = [
  { key: "1", icon: "📧", label: "Gmail", color: c.red, envVar: "TEST_GMAIL_TO" },
  { key: "2", icon: "📘", label: "Outlook / Hotmail", color: c.blue, envVar: "TEST_OUTLOOK_TO" },
  { key: "3", icon: "🍎", label: "Apple Mail (iCloud)", color: c.white, envVar: "TEST_APPLE_TO" },
];

// ─── Elegir proveedor ─────────────────────────────────────────────────────────

/**
 * @param {import('readline').Interface} rl
 * @returns {Promise<typeof PROVIDERS[number]>}
 */
async function pickProvider(rl) {
  console.log(paint(c.bold, "  ¿A cuál bandeja querés enviar?\n"));

  for (const p of PROVIDERS) {
    const key = paint(p.color + c.bold, ` [${p.key}] `);
    const label = paint(p.color, `${p.icon}  ${p.label}`);
    const defaultTo = process.env[p.envVar];
    const hint = defaultTo ? paint(c.dim, `  → ${defaultTo}`) : "";
    console.log(`  ${key} ${label}${hint}`);
  }
  console.log();

  while (true) {
    const raw = await prompt(rl, paint(c.cyan + c.bold, "→ Elegí un número"));
    const found = PROVIDERS.find((p) => p.key === raw.trim());
    if (found) return found;
    console.log(paint(c.red, "  ❌ Opción inválida. Ingresá 1, 2 o 3."));
  }
}

// ─── Flujo principal (exportado para el CLI) ──────────────────────────────────

/**
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function sendToInbox(rl) {
  loadEnv();

  const fromEmailDefault = process.env.GMAIL_USER || "";
  const fromNameDefault = process.env.SMTP_FROM_NAME || "vite-mhb-email";

  console.log(paint(c.magenta + c.bold, "\n  📬 Enviar a bandeja real\n"));

  // 1. Elegir proveedor destino
  const provider = await pickProvider(rl);
  const toDefault = process.env[provider.envVar] || "";

  console.log();

  // 2. Dirección destinataria
  const to = await prompt(rl, `${provider.icon} Email de destino (${provider.label})`, toDefault);
  if (!to) {
    console.log(paint(c.red, "\n  ❌ El email del destinatario es obligatorio.\n"));
    return;
  }

  // 3. Listar templates — ofrecer build si dist/ está vacío
  let templates = getBuiltTemplates();
  if (templates.length === 0) {
    const built = await buildIfNeeded(rl);
    if (!built) return;
    templates = getBuiltTemplates();
    if (templates.length === 0) {
      console.log(paint(c.red, "\n  ❌ El build no generó templates en dist/.\n"));
      return;
    }
  }

  console.log(paint(c.bold, "\n  Templates disponibles:\n"));
  const chosen = await pickFromList(rl, templates);
  const html = readBuiltTemplate(chosen);

  // 4. Remitente y asunto
  console.log();
  const fromEmail = await prompt(rl, "Remitente (tu Gmail)", fromEmailDefault);
  if (!fromEmail) {
    console.log(paint(c.red, "\n  ❌ El email del remitente es obligatorio.\n"));
    return;
  }
  const fromName = await prompt(rl, "Nombre del remitente", fromNameDefault);
  const subject = await prompt(rl, "Asunto del email", `[Test] ${chosen.replace(".html", "")}`);

  // 5. Resumen y confirmación
  console.log();
  console.log(paint(c.bold, "  Resumen del envío:"));
  console.log(`  ${paint(c.dim, "De:")}        ${fromName} <${fromEmail}>`);
  console.log(
    `  ${paint(c.dim, "Para:")}      ${paint(provider.color + c.bold, provider.icon + " " + provider.label)} → ${to}`,
  );
  console.log(`  ${paint(c.dim, "Asunto:")}    ${subject}`);
  console.log(`  ${paint(c.dim, "Template:")}  ${chosen}`);
  console.log();

  const confirm = await prompt(rl, paint(c.yellow + c.bold, "¿Confirmar envío? (s/N)"), "N");
  if (!["s", "S", "y", "Y"].includes(confirm)) {
    console.log(paint(c.yellow, "\n  ⚠️  Envío cancelado.\n"));
    return;
  }

  console.log(paint(c.dim, "\n  Enviando vía Gmail SMTP…"));

  try {
    await sendViaGmail({ html, subject, to, fromEmail, fromName });
    console.log(
      paint(
        c.green + c.bold,
        `\n  ✅ Email enviado a ${provider.icon} ${provider.label} (${to})\n`,
      ),
    );
  } catch (err) {
    console.log(paint(c.red + c.bold, `\n  ❌ Error al enviar: ${err.message}\n`));
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
