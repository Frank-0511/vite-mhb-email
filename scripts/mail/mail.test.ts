import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { sendViaGmail } from "./gmail-transport.ts";
import { PROVIDERS } from "./send-inbox.ts";
import { sendToMailtrap } from "./send-mailtrap.ts";

describe("mail subsystem", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("PROVIDERS", () => {
    test("define exactamente 3 proveedores con claves únicas", () => {
      expect(PROVIDERS.length).toBe(3);
      const keys = PROVIDERS.map((p) => p.key);
      expect(new Set(keys).size).toBe(3);
      expect(keys).toEqual(["1", "2", "3"]);
    });

    test("cada proveedor cuenta con icono, etiqueta y variable de entorno asociada", () => {
      for (const p of PROVIDERS) {
        expect(p.icon).toBeString();
        expect(p.label).toBeString();
        expect(p.envVar).toBeString();
        expect(p.color).toBeString();
      }
    });
  });

  describe("sendViaGmail guards", () => {
    test("rechaza si GMAIL_USER no está configurado", async () => {
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_APP_PASS;

      await expect(
        sendViaGmail({
          html: "<p>test</p>",
          subject: "Test",
          to: "recipient@example.com",
          fromEmail: "sender@gmail.com",
          fromName: "Sender",
        }),
      ).rejects.toThrow("GMAIL_USER no configurado en .env");
    });

    test("rechaza si GMAIL_USER es el placeholder tu@gmail.com", async () => {
      process.env.GMAIL_USER = "tu@gmail.com";
      process.env.GMAIL_APP_PASS = "valid-pass";

      await expect(
        sendViaGmail({
          html: "<p>test</p>",
          subject: "Test",
          to: "recipient@example.com",
          fromEmail: "sender@gmail.com",
          fromName: "Sender",
        }),
      ).rejects.toThrow("GMAIL_USER no configurado en .env");
    });

    test("rechaza si GMAIL_APP_PASS no está configurado", async () => {
      process.env.GMAIL_USER = "user@gmail.com";
      delete process.env.GMAIL_APP_PASS;

      await expect(
        sendViaGmail({
          html: "<p>test</p>",
          subject: "Test",
          to: "recipient@example.com",
          fromEmail: "sender@gmail.com",
          fromName: "Sender",
        }),
      ).rejects.toThrow("GMAIL_APP_PASS no configurado en .env");
    });
  });

  describe("sendToMailtrap", () => {
    test("rechaza si MAILTRAP_API_TOKEN no está configurado", async () => {
      delete process.env.MAILTRAP_API_TOKEN;
      delete process.env.MAILTRAP_INBOX_ID;

      await expect(
        sendToMailtrap({
          html: "<p>test</p>",
          subject: "Test",
          to: "dest@example.com",
          fromEmail: "sender@example.com",
          fromName: "Sender",
        }),
      ).rejects.toThrow("MAILTRAP_API_TOKEN no configurado en .env");
    });

    test("rechaza si MAILTRAP_INBOX_ID no está configurado", async () => {
      process.env.MAILTRAP_API_TOKEN = "valid-token-123";
      delete process.env.MAILTRAP_INBOX_ID;

      await expect(
        sendToMailtrap({
          html: "<p>test</p>",
          subject: "Test",
          to: "dest@example.com",
          fromEmail: "sender@example.com",
          fromName: "Sender",
        }),
      ).rejects.toThrow("MAILTRAP_INBOX_ID no configurado en .env");
    });

    test("realiza la petición POST esperada con los headers de autorización y payload JSON", async () => {
      process.env.MAILTRAP_API_TOKEN = "fake-token";
      process.env.MAILTRAP_INBOX_ID = "998877";

      let capturedUrl = "";
      let capturedInit: RequestInit | undefined;

      const mockFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        capturedUrl = String(input);
        capturedInit = init;
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      };

      const result = await sendToMailtrap({
        html: "<p>Hello Mailtrap</p>",
        subject: "Mailtrap Test Subject",
        to: "recipient@mailtrap.io",
        toName: "Test Recipient",
        fromEmail: "sender@mailtrap.io",
        fromName: "Test Sender",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result).toEqual({ success: true });
      expect(capturedUrl).toBe("https://sandbox.api.mailtrap.io/api/send/998877");
      expect(capturedInit?.method).toBe("POST");

      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer fake-token");
      expect(headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(capturedInit?.body as string);
      expect(body.from).toEqual({ email: "sender@mailtrap.io", name: "Test Sender" });
      expect(body.to).toEqual([{ email: "recipient@mailtrap.io", name: "Test Recipient" }]);
      expect(body.subject).toBe("Mailtrap Test Subject");
      expect(body.html).toBe("<p>Hello Mailtrap</p>");
    });
  });
});
