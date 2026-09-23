/**
 * @fileoverview Fixtures compartidos para tests de integración e2e de build, render, caché y exportación.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TemplateFixture {
  templateName: string;
  htmlContent: string;
  dataContent: Record<string, string>;
}

export function setupTempProjectEnvironment(tempDir: string): void {
  writeFileSync(
    resolve(tempDir, "maizzle.config.js"),
    `export default {
  build: {
    content: ["src/emails/templates/**/*.html"],
    output: { path: "dist", from: ["src/emails/templates"] },
    summary: false
  },
  expressions: {
    delimiters: ["[[", "]]"],
    unescapedDelimiters: ["[[[", "]]]"],
    missingLocal: "{{ local }}"
  }
};\n`,
  );
}

export function createTransactionalFixture(
  tempDir: string,
  templateName = "receipt",
): TemplateFixture {
  const templateDir = resolve(tempDir, "src/emails/templates", templateName);
  setupTempProjectEnvironment(tempDir);

  const htmlContent = `---
title: "Recibo de compra"
emailType: "transactional"
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>[[ page.title ]]</title>
  <style>
    .order-summary { padding: 16px; background-color: #f8fafc; }
    .order-id { font-weight: bold; color: #1e293b; }
    @media (prefers-color-scheme: dark) {
      .order-summary { background-color: #0f172a !important; }
      .order-id { color: #f1f5f9 !important; }
    }
  </style>
</head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0" class="order-summary">
    <tr>
      <td>
        <h1>Confirmación de orden</h1>
        <p>Hola {{ customer_name }}, recibimos tu orden [[ page.title ]].</p>
        <p class="order-id">Orden: {{ order_number }}</p>
        <p>Total pagado: {{ total_amount }}</p>
        <a href="{{ receipt_url }}">Ver recibo online</a>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const dataContent: Record<string, string> = {
    customer_name: "Carlos Gómez",
    order_number: "ORD-2026-987",
    total_amount: "$129.99",
    receipt_url: "https://example.com/orders/987",
  };

  mkdirSync(templateDir, { recursive: true });
  writeFileSync(resolve(templateDir, "index.html"), htmlContent, "utf-8");
  writeFileSync(resolve(templateDir, "data.json"), JSON.stringify(dataContent, null, 2), "utf-8");

  return { templateName, htmlContent, dataContent };
}

export function createMarketingFixture(
  tempDir: string,
  templateName = "newsletter",
): TemplateFixture {
  const templateDir = resolve(tempDir, "src/emails/templates", templateName);
  const htmlContent = `---
title: "Boletín Informativo"
emailType: "marketing"
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>[[ page.title ]]</title>
  <style>
    .news-card { padding: 20px; background-color: #ffffff; }
    @media (prefers-color-scheme: dark) {
      .news-card { background-color: #18181b !important; }
    }
  </style>
</head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0" class="news-card">
    <tr>
      <td>
        <h1>Novedades exclusivas</h1>
        <p>Hola {{ subscriber_name }}, te presentamos la edición mensual de [[ page.title ]].</p>
        <a href="{{ article_url }}">Leer novedades</a>
        <hr>
        <p>
          <a href="{{ preferences_url }}">Modificar preferencias</a> |
          <a href="{{ unsubscribe_url }}">Darse de baja</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const dataContent: Record<string, string> = {
    subscriber_name: "María Rodríguez",
    article_url: "https://example.com/articles/spring-2026",
    preferences_url: "https://example.com/preferences",
    unsubscribe_url: "https://example.com/unsubscribe?id=123",
  };

  mkdirSync(templateDir, { recursive: true });
  writeFileSync(resolve(templateDir, "index.html"), htmlContent, "utf-8");
  writeFileSync(resolve(templateDir, "data.json"), JSON.stringify(dataContent, null, 2), "utf-8");

  return { templateName, htmlContent, dataContent };
}

export class FakeBlob {
  content: string;
  constructor(parts: readonly string[]) {
    this.content = parts.join("");
  }
}

export function createFakeDownloadEnvironment() {
  const fakeDocument = {
    createElement: () => ({ click: () => {} }),
  };
  const fakeUrlApi = {
    createObjectURL: () => "blob:http://localhost/fake-id",
    revokeObjectURL: () => {},
  };
  return {
    fakeDocument: fakeDocument as unknown as Document,
    fakeUrlApi: fakeUrlApi as unknown as typeof URL,
    FakeBlob: FakeBlob as unknown as typeof Blob,
  };
}
