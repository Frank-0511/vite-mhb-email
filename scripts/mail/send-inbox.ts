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

import type { Interface } from "readline";
import { c, loadEnv, paint, prompt } from "../shared/index.ts";
import { sendViaGmail } from "./gmail-transport.ts";
import { selectBuiltTemplateWithData } from "./template-selection.ts";

// ─── Proveedores disponibles ──────────────────────────────────────────────────

export interface MailProvider {
  key: string;
  icon: string;
  label: string;
  color: string;
  envVar: string;
}

export const PROVIDERS: readonly MailProvider[] = Object.freeze([
  { key: "1", icon: "📧", label: "Gmail", color: c.red, envVar: "TEST_GMAIL_TO" },
  { key: "2", icon: "📘", label: "Outlook / Hotmail", color: c.blue, envVar: "TEST_OUTLOOK_TO" },
  { key: "3", icon: "🍎", label: "Apple Mail (iCloud)", color: c.white, envVar: "TEST_APPLE_TO" },
]);

// ─── Elegir proveedor ─────────────────────────────────────────────────────────

/**
 * Solicita interactivamente al usuario seleccionar uno de los proveedores soportados.
 */
async function pickProvider(rl: Interface): Promise<MailProvider> {
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
 * Orquesta el flujo de envío a bandejas reales.
 *
 * @param rl - readline heredado del CLI
 */
export async function sendToInbox(rl: Interface): Promise<void> {
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

  // 3. Listar templates y aplicar datos
  const selection = await selectBuiltTemplateWithData(rl);
  if (!selection) return;
  const { chosen, html } = selection;

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(paint(c.red + c.bold, `\n  ❌ Error al enviar: ${errorMsg}\n`));
    if (errorMsg.includes("Invalid login")) {
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
