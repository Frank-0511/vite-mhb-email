/**
 * @fileoverview Envía un template buildeado a mail-tester.com vía Gmail SMTP.
 *
 * Variables requeridas en .env:
 *   GMAIL_USER          — tu dirección de Gmail (ej. tu@gmail.com)
 *   GMAIL_APP_PASS      — App Password de Google
 *   SMTP_FROM_NAME      — nombre remitente por defecto (opcional)
 *   MAILTESTER_TO_EMAIL — dirección de mail-tester.com por defecto (opcional)
 */

import { buildIfNeeded } from "../build/build-helper.js";
import { sendViaGmail } from "./gmail-transport.js";
import {
  applyHandlebars,
  c,
  getBuiltTemplates,
  getTemplateData,
  loadEnv,
  paint,
  pickFromList,
  prompt,
  readBuiltTemplate,
} from "../utils.js";

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
  console.log(paint(c.dim, "  1. Andá a https://mail-tester.com"));
  console.log(
    paint(c.dim, "  2. Copiá la dirección única que te dan (ej. test-xyz123@mail-tester.com)"),
  );
  console.log(paint(c.dim, "  3. Pegala aquí abajo y enviamos el template.\n"));

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

  // 2. Listar templates — ofrecer build si dist/ está vacío
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
  let html = readBuiltTemplate(chosen);

  // Aplicar datos Handlebars desde data.json
  const data = getTemplateData(chosen);
  html = applyHandlebars(html, data);

  // 3. Remitente y asunto
  console.log();
  const fromEmail = await prompt(rl, "Remitente (tu Gmail)", fromEmailDefault);
  if (!fromEmail) {
    console.log(paint(c.red, "\n  ❌ El email del remitente es obligatorio.\n"));
    return;
  }
  const fromName = await prompt(rl, "Nombre del remitente", fromNameDefault);
  const subject = await prompt(rl, "Asunto del email", `[Test] ${chosen.replace(".html", "")}`);

  // 4. Resumen y confirmación
  console.log();
  console.log(paint(c.bold, "  Resumen del envío:"));
  console.log(`  ${paint(c.dim, "De:")}      ${fromName} <${fromEmail}>`);
  console.log(`  ${paint(c.dim, "Para:")}    ${mailtesterAddr}`);
  console.log(`  ${paint(c.dim, "Asunto:")}  ${subject}`);
  console.log(`  ${paint(c.dim, "Template:")} ${chosen}`);
  console.log();

  const confirm = await prompt(rl, paint(c.yellow + c.bold, "¿Confirmar envío? (s/N)"), "N");
  if (!["s", "S", "y", "Y"].includes(confirm)) {
    console.log(paint(c.yellow, "\n  ⚠️  Envío cancelado.\n"));
    return;
  }

  console.log(paint(c.dim, "\n  Enviando vía Gmail SMTP…"));

  try {
    await sendViaGmail({ html, subject, to: mailtesterAddr, fromEmail, fromName });

    const prefix = mailtesterAddr.split("@")[0];
    const resultUrl = `https://www.mail-tester.com/${prefix}`;

    console.log(paint(c.green + c.bold, "\n  ✅ Email enviado exitosamente a Mail-Tester"));
    console.log(paint(c.bold, `\n  🔗 Revisá tu score en:`));
    console.log(`     ${paint(c.cyan + c.bold, resultUrl)}\n`);
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
