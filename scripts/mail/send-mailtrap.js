/**
 * @fileoverview Envía un template buildeado a un inbox de Mailtrap Sandbox
 * usando la API HTTP oficial.
 *
 * Variables requeridas en .env:
 *   MAILTRAP_API_TOKEN  — token de API de Mailtrap
 *   MAILTRAP_INBOX_ID   — ID del inbox sandbox
 *   MAILTRAP_FROM_EMAIL — email remitente por defecto (opcional)
 *   MAILTRAP_FROM_NAME  — nombre remitente por defecto (opcional)
 *   MAILTRAP_TO_EMAIL   — email destinatario por defecto (opcional)
 *   MAILTRAP_TO_NAME    — nombre destinatario por defecto (opcional)
 */

import { buildIfNeeded } from "../build/build-helper.js";
import { getBuiltTemplates, readBuiltTemplate } from "../shared/built-templates.js";
import { c, paint } from "../shared/console.js";
import { loadEnv } from "../shared/env.js";
import { applyHandlebars, getTemplateData } from "../shared/handlebars.js";
import { pickFromList, prompt } from "../shared/prompts.js";

// ─── Envío a Mailtrap ─────────────────────────────────────────────────────────

/**
 * @param {{ html: string, subject: string, to: string, toName: string, fromEmail: string, fromName: string }} opts
 * @returns {Promise<void>}
 */
async function sendToMailtrap({ html, subject, to, toName, fromEmail, fromName }) {
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

  const fromEmailDefault = process.env.MAILTRAP_FROM_EMAIL || "no-reply@example.com";
  const fromNameDefault = process.env.MAILTRAP_FROM_NAME || "vite-mhb-email";
  const toEmailDefault = process.env.MAILTRAP_TO_EMAIL || "";
  const toNameDefault = process.env.MAILTRAP_TO_NAME || "";

  console.log(paint(c.magenta + c.bold, "\n  📨 Enviar template a Mailtrap\n"));

  // 1. Listar templates — ofrecer build si dist/ está vacío
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

  console.log(paint(c.bold, "  Templates disponibles:\n"));
  const chosen = await pickFromList(rl, templates);
  let html = readBuiltTemplate(chosen);

  // Aplicar datos Handlebars desde data.json
  const data = getTemplateData(chosen);
  html = applyHandlebars(html, data);

  // 2. Datos del envío
  console.log();
  const to = await prompt(rl, "Destinatario (email)", toEmailDefault);
  if (!to) {
    console.log(paint(c.red, "\n  ❌ El email del destinatario es obligatorio.\n"));
    return;
  }
  const toName = await prompt(rl, "Nombre del destinatario", toNameDefault);
  const fromEmail = await prompt(rl, "Remitente (email)", fromEmailDefault);
  const fromName = await prompt(rl, "Nombre del remitente", fromNameDefault);
  const subject = await prompt(rl, "Asunto del email", `[Test] ${chosen.replace(".html", "")}`);

  // 3. Resumen y confirmación
  console.log();
  console.log(paint(c.bold, "  Resumen del envío:"));
  console.log(`  ${paint(c.dim, "De:")}      ${fromName} <${fromEmail}>`);
  console.log(`  ${paint(c.dim, "Para:")}    ${toName || to} <${to}>`);
  console.log(`  ${paint(c.dim, "Asunto:")}  ${subject}`);
  console.log(`  ${paint(c.dim, "Template:")} ${chosen}`);
  console.log();

  const confirm = await prompt(rl, paint(c.yellow + c.bold, "¿Confirmar envío? (s/N)"), "N");
  if (!["s", "S", "y", "Y"].includes(confirm)) {
    console.log(paint(c.yellow, "\n  ⚠️  Envío cancelado.\n"));
    return;
  }

  console.log(paint(c.dim, "\n  Enviando…"));

  try {
    await sendToMailtrap({ html, subject, to, toName, fromEmail, fromName });
    console.log(paint(c.green + c.bold, `\n  ✅ Email enviado exitosamente a ${to}`));
    console.log(paint(c.dim, "     Revisá tu inbox en https://mailtrap.io\n"));
  } catch (err) {
    console.log(paint(c.red + c.bold, `\n  ❌ Error al enviar: ${err.message}\n`));
  }
}
