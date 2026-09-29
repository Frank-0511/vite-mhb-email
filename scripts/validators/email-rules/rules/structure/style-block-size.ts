import { EMAIL_STYLE_BLOCK_MAX_BYTES } from "../../../../shared/contracts/constants/email-assets.ts";
import { extractStyleBlocks, Severity, type Issue, type Rule } from "../../context.ts";

/**
 * Gmail descarta un bloque <style> completo si supera 8192 bytes, perdiendo
 * también las media queries de dark mode que sí sobreviven al inlining.
 * Desviación de alcance de MHB-44 acordada con el usuario el 2026-09-25.
 */
const styleBlockSize: Rule = {
  id: "style-block-size",
  severity: Severity.ERROR,
  description: "Detecta bloques <style> que superan el límite de 8192 bytes de Gmail",
  check(html: string): Issue[] {
    return extractStyleBlocks(html)
      .map((block, index) => ({ index, bytes: Buffer.byteLength(block, "utf8") }))
      .filter(({ bytes }) => bytes > EMAIL_STYLE_BLOCK_MAX_BYTES)
      .map(({ index, bytes }) => ({
        ruleId: "style-block-size",
        severity: Severity.ERROR,
        message: `Bloque <style> #${index} pesa ${bytes} bytes (> ${EMAIL_STYLE_BLOCK_MAX_BYTES}); Gmail lo descarta completo`,
        hint: "Reducir selectores redundantes en <style> (revisar css.inline.removeInlinedSelectors en maizzle.config.js) o dividir el bloque",
      }));
  },
};

export default styleBlockSize;
