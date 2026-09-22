/**
 * @fileoverview Transporte Gmail SMTP compartido para los scripts de envío.
 * Encapsula la lógica de nodemailer para no repetirla en send-mailtester.ts y send-inbox.ts.
 */

import { createTransport } from "nodemailer";

/**
 * Opciones para el envío de email mediante Gmail SMTP.
 */
export interface GmailSendOptions {
  html: string;
  subject: string;
  to: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Envía un email HTML usando Gmail SMTP (App Password).
 *
 * @throws {Error} si GMAIL_USER o GMAIL_APP_PASS no están configurados
 */
export async function sendViaGmail({
  html,
  subject,
  to,
  fromEmail,
  fromName,
}: GmailSendOptions): Promise<void> {
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
