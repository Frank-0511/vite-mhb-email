// @ts-check
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { downloadHtml } from "./html-download.js";

describe("downloadHtml", () => {
  class MockBlob {
    /**
     * @param {any[]} parts
     * @param {{ type: string }} options
     */
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  }

  /** @type {{ href: string, download: string, clicked: boolean, click: any }} */
  let createdAnchor;
  /** @type {MockBlob | null} */
  let createdBlob;
  /** @type {any} */
  let mockDocument;
  /** @type {any} */
  let mockUrlApi;

  beforeEach(() => {
    createdAnchor = {
      href: "",
      download: "",
      clicked: false,
      click: mock(() => {
        createdAnchor.clicked = true;
      }),
    };
    createdBlob = null;
    mockDocument = {
      createElement: mock((tag) => {
        if (tag === "a") return createdAnchor;
        return {};
      }),
    };
    mockUrlApi = {
      counter: 0,
      /** @type {string[]} */
      revoked: [],
      createObjectURL: mock((blob) => {
        createdBlob = blob;
        mockUrlApi.counter += 1;
        return `blob:download-${mockUrlApi.counter}`;
      }),
      revokeObjectURL: mock((url) => {
        mockUrlApi.revoked.push(url);
      }),
    };
  });

  test("descarga welcome.html con el HTML recibido y MIME text/html", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<!doctype html><p>Hola</p>",
      document: mockDocument,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual({ ok: true, filename: "welcome.html" });
    expect(createdAnchor.download).toBe("welcome.html");
    expect(createdAnchor.href).toBe("blob:download-1");
    expect(createdAnchor.clicked).toBe(true);
    expect(createdBlob?.parts).toEqual(["<!doctype html><p>Hola</p>"]);
    expect(createdBlob?.options).toEqual({ type: "text/html;charset=utf-8" });
    expect(mockUrlApi.revoked).toEqual(["blob:download-1"]);
  });

  test.each(["../escape", "welcome.html", "WELCOME", "two words", "a/b", "a\\b"])(
    "rechaza un nombre de template inseguro: %s",
    (templateName) => {
      const browserDeps = {
        document: mockDocument,
        Blob: MockBlob,
        urlApi: mockUrlApi,
      };

      expect(downloadHtml({ templateName, html: "<p>x</p>", ...browserDeps })).toEqual(
        expect.objectContaining({ ok: false }),
      );
      expect(mockUrlApi.createObjectURL).not.toHaveBeenCalled();
    },
  );

  test.each([[null], [undefined], [123], [{}], [[]]])(
    "rechaza un HTML que no es string: %p",
    (html) => {
      const result = downloadHtml({
        templateName: "welcome",
        // @ts-ignore
        html,
        document: mockDocument,
        Blob: MockBlob,
        urlApi: mockUrlApi,
      });

      expect(result).toEqual(expect.objectContaining({ ok: false }));
      expect(mockUrlApi.createObjectURL).not.toHaveBeenCalled();
    },
  );

  test("falla limpiamente si falta document o document.createElement", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<p>Hola</p>",
      document: undefined,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false }));
    expect(mockUrlApi.createObjectURL).not.toHaveBeenCalled();
  });

  test("falla limpiamente si falta Blob", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<p>Hola</p>",
      document: mockDocument,
      Blob: undefined,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false }));
    expect(mockUrlApi.createObjectURL).not.toHaveBeenCalled();
  });

  test("falla limpiamente si falta urlApi o sus métodos", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<p>Hola</p>",
      document: mockDocument,
      Blob: MockBlob,
      urlApi: undefined,
    });

    expect(result).toEqual(expect.objectContaining({ ok: false }));
  });

  test("revoca la URL si anchor.click lanza una excepción", () => {
    createdAnchor.click = mock(() => {
      throw new Error("Simulated click failure");
    });

    const result = downloadHtml({
      templateName: "welcome",
      html: "<p>Hola</p>",
      document: mockDocument,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual({
      ok: false,
      error: "Simulated click failure",
    });
    expect(mockUrlApi.revoked).toEqual(["blob:download-1"]);
  });

  test("falla limpiamente si createObjectURL lanza excepción", () => {
    mockUrlApi.createObjectURL = mock(() => {
      throw new Error("QuotaExceededError");
    });

    const result = downloadHtml({
      templateName: "welcome",
      html: "<p>Hola</p>",
      document: mockDocument,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual({
      ok: false,
      error: "QuotaExceededError",
    });
    expect(mockUrlApi.revoked).toEqual([]);
  });

  test("el mensaje de error nunca expone el contenido HTML confidencial", () => {
    const secretHtml = "<p>SUPER_SECRET_PAYLOAD</p>";
    const result = downloadHtml({
      templateName: "../invalid",
      html: secretHtml,
      document: mockDocument,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result.ok).toBe(false);
    if ("error" in result) {
      expect(result.error).not.toContain("SUPER_SECRET_PAYLOAD");
    }
  });
});
