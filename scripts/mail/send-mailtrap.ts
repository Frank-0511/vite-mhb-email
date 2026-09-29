/**
 * @fileoverview Envía un template buildeado a Mailtrap (Sandbox o Sending API)
 * usando la API HTTP oficial. Solo requiere API token o API key.
 *
 * Variables de entorno soportadas:
 *   MAILTRAP_API_TOKEN  — token de API de Mailtrap (o MAILTRAP_API_KEY)
 *   MAILTRAP_API_KEY    — token alternativo de API de Mailtrap
 *   MAILTRAP_INBOX_ID   — ID del inbox sandbox (opcional, auto-detectable)
 *   MAILTRAP_FROM_EMAIL — email remitente por defecto (opcional)
 *   MAILTRAP_FROM_NAME  — nombre remitente por defecto (opcional)
 *   MAILTRAP_TO_EMAIL   — email destinatario por defecto (opcional)
 *   MAILTRAP_TO_NAME    — nombre destinatario por defecto (opcional)
 */

import type { Interface } from "readline";
import { c, loadEnv, paint, prompt } from "../shared/index.ts";
import { selectBuiltTemplateWithData } from "./template-selection.ts";

/**
 * Opciones para el envío a Mailtrap API.
 */
export interface MailtrapSendOptions {
  html: string;
  subject: string;
  to: string;
  toName?: string;
  fromEmail: string;
  fromName: string;
  inboxId?: string | number;
  fetchFn?: typeof fetch;
}

/**
 * Obtiene el token de autenticación para Mailtrap desde las variables de entorno.
 * Soporta tanto MAILTRAP_API_TOKEN como MAILTRAP_API_KEY.
 */
export function getMailtrapToken(): string | undefined {
  const token = process.env.MAILTRAP_API_TOKEN || process.env.MAILTRAP_API_KEY;
  if (!token || token === "your_api_token_here" || token === "your_api_key_here") {
    return undefined;
  }
  return token;
}

/**
 * Intenta descubrir automáticamente el primer ID de inbox disponible en
 * Mailtrap Sandbox consultando la API oficial de cuentas.
 */
export async function discoverSandboxInboxId(
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<string | number | null> {
  try {
    const accRes = await fetchFn("https://mailtrap.io/api/accounts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!accRes.ok) return null;
    const accounts = (await accRes.json()) as Array<{ id?: number | string }>;
    if (!Array.isArray(accounts)) return null;

    for (const account of accounts) {
      if (!account?.id) continue;
      const inboxesRes = await fetchFn(`https://mailtrap.io/api/accounts/${account.id}/inboxes`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!inboxesRes.ok) continue;
      const inboxes = (await inboxesRes.json()) as Array<{ id?: number | string }>;
      if (Array.isArray(inboxes) && inboxes[0]?.id) {
        return inboxes[0].id;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Determina el endpoint de destino en Mailtrap.
 * Si se especifica inboxId o se detecta en Sandbox, apunta a sandbox.api.mailtrap.io.
 * Si no se encuentra ningún inbox (ej. token de Sending API), apunta a send.api.mailtrap.io.
 */
export async function resolveMailtrapEndpoint(
  token: string,
  explicitInboxId?: string | number,
  fetchFn: typeof fetch = fetch,
): Promise<{ url: string; inboxId?: string | number }> {
  if (explicitInboxId) {
    return {
      url: `https://sandbox.api.mailtrap.io/api/send/${explicitInboxId}`,
      inboxId: explicitInboxId,
    };
  }

  const discoveredInboxId = await discoverSandboxInboxId(token, fetchFn);
  if (discoveredInboxId) {
    return {
      url: `https://sandbox.api.mailtrap.io/api/send/${discoveredInboxId}`,
      inboxId: discoveredInboxId,
    };
  }

  return { url: "https://send.api.mailtrap.io/api/send" };
}

// ─── Envío a Mailtrap ─────────────────────────────────────────────────────────

/**
 * Envía el email a Mailtrap Sandbox o Sending API mediante su API REST oficial.
 */
export async function sendToMailtrap({
  html,
  subject,
  to,
  toName,
  fromEmail,
  fromName,
  inboxId,
  fetchFn = fetch,
}: MailtrapSendOptions): Promise<unknown> {
  const token = getMailtrapToken();

  if (!token) {
    throw new Error("MAILTRAP_API_TOKEN no configurado en .env (o MAILTRAP_API_KEY)");
  }

  const envInbox = process.env.MAILTRAP_INBOX_ID;
  const targetInbox =
    inboxId ?? (envInbox && envInbox !== "your_inbox_id_here" ? envInbox : undefined);

  const { url } = await resolveMailtrapEndpoint(token, targetInbox, fetchFn);

  const body = JSON.stringify({
    from: { email: fromEmail, name: fromName },
    to: [{ email: to, name: toName || to }],
    subject,
    html,
  });

  const res = await fetchFn(url, {
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
 * Orquesta el flujo interactivo de envío a Mailtrap desde la CLI.
 *
 * @param rl - readline heredado del CLI
 */
export async function sendTemplate(rl: Interface): Promise<void> {
  loadEnv();

  const fromEmailDefault = process.env.MAILTRAP_FROM_EMAIL || "no-reply@example.com";
  const fromNameDefault = process.env.MAILTRAP_FROM_NAME || "vite-mhb-email";
  const toEmailDefault = process.env.MAILTRAP_TO_EMAIL || "";
  const toNameDefault = process.env.MAILTRAP_TO_NAME || "";

  console.log(paint(c.magenta + c.bold, "\n  📨 Enviar template a Mailtrap\n"));

  // 1. Listar templates y aplicar datos
  const selection = await selectBuiltTemplateWithData(rl);
  if (!selection) return;
  const { chosen, html } = selection;

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(paint(c.red + c.bold, `\n  ❌ Error al enviar: ${errorMsg}\n`));
  }
}
