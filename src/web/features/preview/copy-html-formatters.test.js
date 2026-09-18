// @ts-check
import { describe, expect, test } from "bun:test";

import { copyTextToClipboard } from "./copy-html-formatters.js";

describe("copyTextToClipboard", () => {
  test("devuelve true si el portapapeles escribe correctamente", async () => {
    let written = "";
    const clipboard = {
      writeText: (text) => {
        written = text;
        return Promise.resolve();
      },
    };

    const success = await copyTextToClipboard("<!DOCTYPE html>", clipboard);
    expect(success).toBe(true);
    expect(written).toBe("<!DOCTYPE html>");
  });

  test("devuelve false si writeText arroja una excepción", async () => {
    const clipboard = {
      writeText: () => Promise.reject(new Error("Clipboard permission denied")),
    };

    const success = await copyTextToClipboard("<p>test</p>", clipboard);
    expect(success).toBe(false);
  });

  test("devuelve false si el objeto clipboard no existe o no tiene writeText", async () => {
    expect(await copyTextToClipboard("html", undefined)).toBe(false);
    // @ts-expect-error clipboard inválido
    expect(await copyTextToClipboard("html", {})).toBe(false);
    // @ts-expect-error clipboard inválido
    expect(await copyTextToClipboard("html", { writeText: "no-function" })).toBe(false);
  });
});
