import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { DownloadHtmlOptions } from "./html-download.ts";
import { downloadHtml } from "./html-download.ts";

describe("downloadHtml", () => {
  class MockBlob {
    /**
     * @param {any[]} parts
     * @param {{ type: string }} options
     */
    parts: unknown[];
    options: { type: string };

    constructor(parts: unknown[], options: { type: string }) {
      this.parts = parts;
      this.options = options;
    }
  }

  const MockBlobConstructor = MockBlob as unknown as typeof Blob;

  let createdAnchor: { href: string; download: string; clicked: boolean; click: () => void };
  let createdBlob: MockBlob | null;
  type MockDocument = NonNullable<DownloadHtmlOptions["document"]>;
  type MockUrlApi = NonNullable<DownloadHtmlOptions["urlApi"]> & {
    counter: number;
    revoked: string[];
  };
  let mockDocument: MockDocument;
  let mockUrlApi: MockUrlApi;

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
      createElement: mock((tag: string) => {
        if (tag === "a") return createdAnchor;
        return {};
      }),
    } as unknown as MockDocument;
    mockUrlApi = {
      counter: 0,
      /** @type {string[]} */
      revoked: [],
      createObjectURL: mock((blob: unknown) => {
        createdBlob = blob as MockBlob;
        mockUrlApi.counter += 1;
        return `blob:download-${mockUrlApi.counter}`;
      }),
      revokeObjectURL: mock((url: string) => {
        mockUrlApi.revoked.push(url);
      }),
    } as MockUrlApi;
  });

  test("descarga welcome.html con el HTML recibido y MIME text/html", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<!doctype html><p>Hola</p>",
      document: mockDocument,
      Blob: MockBlobConstructor,
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
        Blob: MockBlobConstructor,
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
        // @ts-expect-error Mock intentionally omits the browser download API.
        html: html as string,
        document: mockDocument,
        Blob: MockBlobConstructor,
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
      Blob: MockBlobConstructor,
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
      Blob: MockBlobConstructor,
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
      Blob: MockBlobConstructor,
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
      Blob: MockBlobConstructor,
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
      Blob: MockBlobConstructor,
      urlApi: mockUrlApi,
    });

    expect(result.ok).toBe(false);
    if ("error" in result) {
      expect(result.error).not.toContain("SUPER_SECRET_PAYLOAD");
    }
  });
});
