// @ts-check
import { describe, expect, test } from "bun:test";
import { normalizeRenderError, RENDER_ERROR_VERSION } from "./render-error.js";

describe("render-error (normalizador seguro)", () => {
  const templatesRoot = "/tmp/project/src/emails/templates";

  test("exporta RENDER_ERROR_VERSION como 1", () => {
    expect(RENDER_ERROR_VERSION).toBe(1);
  });

  test("convierte una ruta absoluta bajo templates en ubicación relativa", () => {
    const result = normalizeRenderError(
      Object.assign(new SyntaxError("unexpected token"), {
        path: "/tmp/project/src/emails/templates/welcome/index.html",
        line: 12,
        column: 4,
      }),
      { templatesRoot },
    );

    expect(result).toEqual({
      version: 1,
      code: "RENDER_FAILED",
      message: "No se pudo renderizar el template.",
      cause: "El template contiene sintaxis inválida.",
      location: { path: "welcome/index.html", line: 12, column: 4 },
    });
  });

  test("omite rutas externas, stack y mensaje bruto", () => {
    const error = Object.assign(new Error("token=secret /Users/name/private"), {
      path: "/Users/name/private",
      stack: "stack trace",
    });
    const result = normalizeRenderError(error, { templatesRoot });

    expect(JSON.stringify(result)).not.toContain("/Users/name");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("stack trace");
    expect(result.location).toBeUndefined();
  });

  test("clasifica ENOENT como fuente requerida no encontrada", () => {
    const error = {
      code: "ENOENT",
      path: "/tmp/project/src/emails/templates/missing.html",
    };
    const result = normalizeRenderError(error, { templatesRoot });

    expect(result.cause).toBe("Fuente requerida no encontrada.");
    expect(result.location).toEqual({ path: "missing.html" });
  });

  test("clasifica error genérico como fallo de compilación", () => {
    const error = new Error("something went wrong inside dependency");
    const result = normalizeRenderError(error, { templatesRoot });

    expect(result.cause).toBe("Fallo de compilación.");
    expect(result.location).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("something went wrong");
  });

  test("maneja valores no Error de forma segura", () => {
    const nullResult = normalizeRenderError(null, { templatesRoot });
    expect(nullResult).toEqual({
      version: 1,
      code: "RENDER_FAILED",
      message: "No se pudo renderizar el template.",
      cause: "Fallo de compilación.",
    });

    const stringResult = normalizeRenderError("raw string error", { templatesRoot });
    expect(stringResult).toEqual({
      version: 1,
      code: "RENDER_FAILED",
      message: "No se pudo renderizar el template.",
      cause: "Fallo de compilación.",
    });
    expect(JSON.stringify(stringResult)).not.toContain("raw string error");
  });

  test("omite línea o columna si no son enteros positivos", () => {
    const zeroLine = normalizeRenderError(
      Object.assign(new SyntaxError("err"), {
        path: "/tmp/project/src/emails/templates/welcome/index.html",
        line: 0,
        column: -1,
      }),
      { templatesRoot },
    );
    expect(zeroLine.location).toEqual({ path: "welcome/index.html" });

    const stringLine = normalizeRenderError(
      Object.assign(new SyntaxError("err"), {
        path: "/tmp/project/src/emails/templates/welcome/index.html",
        line: "12",
        column: 3.5,
      }),
      { templatesRoot },
    );
    expect(stringLine.location).toEqual({ path: "welcome/index.html" });
  });

  test("omite location si hay path traversal que escapa templatesRoot", () => {
    const traversalError = Object.assign(new SyntaxError("err"), {
      path: "/tmp/project/src/emails/templates/../../etc/passwd",
      line: 5,
    });
    const result = normalizeRenderError(traversalError, { templatesRoot });

    expect(result.location).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("passwd");
  });
});
