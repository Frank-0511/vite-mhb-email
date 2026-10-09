/**
 * @fileoverview Guard y validación automática de la matriz de evidencia E3 y checklist A11Y.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname ?? ".", "../../..");
const MATRIX_PATH = join(PROJECT_ROOT, "docs/guides/COMPATIBILITY-MATRIX.md");
const CHECKLIST_PATH = join(PROJECT_ROOT, "docs/guides/EMAIL-A11Y-CHECKLIST.md");
const EVIDENCE_DIR = join(PROJECT_ROOT, "docs/evidence/mhb-14");

const TARGET_CLIENTS = [
  "gmail-web",
  "gmail-app",
  "outlook-com",
  "outlook-windows",
  "apple-mail-mac",
  "apple-mail-ios",
] as const;

const VALID_CLIENTS = new Set([...TARGET_CLIENTS, "outlook-mac"]);
const PRODUCT_TEMPLATES = new Set(["welcome", "password-reset", "receipt", "newsletter"]);
const VALID_RESULTADOS = new Set(["Aprobado", "Parcial", "Fallido", "No verificado"]);
const VALID_ENVIOS = new Set(["cli-4", "cli-5", "cli-6", "sendgrid-externo"]);
const VALID_CHECKLIST_TIPOS = new Set([
  "Estático",
  "Manual-teclado",
  "Manual-lector",
  "Manual-visual",
]);

interface TableRow {
  Fecha: string;
  Cliente: string;
  Template: string;
  Criterio: string;
  Resultado: string;
  Commit: string;
  Envío: string;
  Evidencia: string;
  Observación: string;
}

function parseMarkdownTable(sectionText: string): TableRow[] {
  const lines = sectionText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (lines.length < 3) return [];

  const headers = lines[0]
    .slice(1, -1)
    .split("|")
    .map((h) => h.trim());
  const rows: TableRow[] = [];

  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());
    if (cells.length === headers.length) {
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = cells[idx];
      });
      rows.push(record as unknown as TableRow);
    }
  }
  return rows;
}

function getSectionContent(content: string, heading: string): string {
  const regex = new RegExp(`##\\s+${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##\\s+|$)`);
  const match = regex.exec(content);
  return match ? match[1] : "";
}

function extractChecklistIds(checklistContent: string): Set<string> {
  const ids = new Set<string>();
  const matches = checklistContent.matchAll(/\|\s*(A11Y-\d{2})\s*\|/g);
  for (const m of matches) {
    ids.add(m[1]);
  }
  return ids;
}

function extractTechniqueRows(matrixContent: string): Set<string> {
  const section = getSectionContent(matrixContent, "Matriz de técnicas por cliente");
  const techniques = new Set<string>();
  const lines = section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (lines.length > 2) {
    for (let i = 2; i < lines.length; i++) {
      const firstCol = lines[i].slice(1, -1).split("|")[0]?.trim();
      if (firstCol && !firstCol.startsWith("---")) {
        techniques.add(firstCol);
      }
    }
  }
  return techniques;
}

describe("guard de registro de evidencia (evidence-matrix)", () => {
  const matrixContent = readFileSync(MATRIX_PATH, "utf8");
  const checklistContent = readFileSync(CHECKLIST_PATH, "utf8");
  const registrySection = getSectionContent(matrixContent, "Registro de pruebas reales \\(E3\\)");
  const rows = parseMarkdownTable(registrySection);
  const checklistIds = extractChecklistIds(checklistContent);
  const techniqueRows = extractTechniqueRows(matrixContent);

  test("1. la sección 'Registro de pruebas reales (E3)' existe con encabezado exacto", () => {
    expect(matrixContent).toContain("## Registro de pruebas reales (E3)");
    const headerPattern =
      /\|\s*Fecha\s*\|\s*Cliente\s*\|\s*Template\s*\|\s*Criterio\s*\|\s*Resultado\s*\|\s*Commit\s*\|\s*Envío\s*\|\s*Evidencia\s*\|\s*Observación\s*\|/;
    expect(headerPattern.test(registrySection)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });

  test("2. contiene al menos una fila por cada combinación cliente objetivo × template", () => {
    for (const client of TARGET_CLIENTS) {
      for (const template of PRODUCT_TEMPLATES) {
        const found = rows.some((r) => r.Cliente === client && r.Template === template);
        expect(
          found,
          `Falta fila en el registro para cliente "${client}" y template "${template}"`,
        ).toBe(true);
      }
    }
  });

  test("3. valida formato de campos: fecha ISO no futura, enums, SHA y criterio existente", () => {
    const today = new Date().toISOString().slice(0, 10);
    const validCriteria = new Set([...techniqueRows, ...checklistIds]);

    for (const row of rows) {
      expect(row.Fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(row.Fecha))).toBe(false);
      expect(row.Fecha <= today).toBe(true);

      expect(VALID_CLIENTS.has(row.Cliente)).toBe(true);
      expect(PRODUCT_TEMPLATES.has(row.Template)).toBe(true);
      expect(VALID_RESULTADOS.has(row.Resultado)).toBe(true);
      expect(VALID_ENVIOS.has(row.Envío)).toBe(true);
      expect(row.Commit).toMatch(/^[0-9a-fA-F]{7,40}$/);

      expect(
        validCriteria.has(row.Criterio),
        `Criterio desconocido "${row.Criterio}" en fila ${row.Cliente}/${row.Template}`,
      ).toBe(true);
    }
  });

  test("4. resultado no verificado no exige captura; cualquier otro exige png existente y observación obligatoria en parcial/fallido/no verificado", () => {
    for (const row of rows) {
      if (row.Resultado === "No verificado") {
        expect(row.Evidencia).toBe("—");
        expect(row.Observación.trim().length).toBeGreaterThan(0);
      } else {
        const match = row.Evidencia.match(
          /\[.*?\]\(((\.\.\/evidence\/mhb-14\/[a-zA-Z0-9_-]+\.png))\)/,
        );
        expect(
          match,
          `Evidencia inválida para resultado "${row.Resultado}": ${row.Evidencia}`,
        ).not.toBeNull();
        if (match) {
          const relPath = match[1].replace(/^\.\.\/evidence\/mhb-14\//, "");
          const fullPath = join(EVIDENCE_DIR, relPath);
          expect(existsSync(fullPath), `El archivo de captura no existe: ${fullPath}`).toBe(true);
        }

        if (row.Resultado !== "Aprobado") {
          expect(row.Observación.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  test("5. toda celda E3 de la matriz de técnicas tiene respaldo con Aprobado o Parcial", () => {
    const section = getSectionContent(matrixContent, "Matriz de técnicas por cliente");
    const lines = section
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("|") && l.endsWith("|"));
    if (lines.length < 3) return;

    const headers = lines[0]
      .slice(1, -1)
      .split("|")
      .map((h) => h.trim());
    const headerToClient: Record<string, string> = {
      "Gmail web": "gmail-web",
      "Gmail app": "gmail-app",
      "Outlook.com": "outlook-com",
      "Outlook (Windows)": "outlook-windows",
      "Apple Mail macOS": "apple-mail-mac",
      "Apple Mail iOS": "apple-mail-ios",
    };

    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i]
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      const technique = cells[0];
      for (let colIdx = 1; colIdx < cells.length - 1; colIdx++) {
        const cellValue = cells[colIdx];
        if (cellValue.startsWith("E3")) {
          const colHeader = headers[colIdx];
          const clientId = headerToClient[colHeader];
          expect(clientId, `Columna de cliente no reconocida: ${colHeader}`).toBeDefined();
          const backed = rows.some(
            (r) =>
              r.Cliente === clientId &&
              r.Criterio === technique &&
              (r.Resultado === "Aprobado" || r.Resultado === "Parcial"),
          );
          expect(
            backed,
            `Celda E3 para "${technique}" en "${clientId}" carece de respaldo Aprobado o Parcial en el registro`,
          ).toBe(true);
        }
      }
    }
  });

  test("6. ningún archivo .png huérfano en docs/evidence/mhb-14/", () => {
    if (!existsSync(EVIDENCE_DIR)) return;
    const files = readdirSync(EVIDENCE_DIR).filter((f) => f.endsWith(".png"));
    const referencedPngs = new Set<string>();

    for (const row of rows) {
      const match = row.Evidencia.match(/\[.*?\]\(\.\.\/evidence\/mhb-14\/([^)]+\.png)\)/);
      if (match) {
        referencedPngs.add(match[1]);
      }
    }

    for (const file of files) {
      expect(
        referencedPngs.has(file),
        `Captura huérfana no referenciada en el registro E3: ${file}`,
      ).toBe(true);
    }
  });

  test("7. sanitización textual de COMPATIBILITY-MATRIX.md y EMAIL-A11Y-CHECKLIST.md", () => {
    const docs = [
      { name: "COMPATIBILITY-MATRIX.md", content: matrixContent },
      { name: "EMAIL-A11Y-CHECKLIST.md", content: checklistContent },
    ];

    const allowedDomainSuffixes = ["@example.com", "@example.org", "@miempresa.com"];

    for (const doc of docs) {
      const emails = doc.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
      for (const email of emails) {
        const allowed = allowedDomainSuffixes.some((domain) => email.endsWith(domain));
        expect(allowed, `Email no permitido detectado en ${doc.name}: ${email}`).toBe(true);
      }

      expect(doc.content).not.toMatch(/SG\.[A-Za-z0-9_-]{10,}/);
      expect(doc.content).not.toMatch(/xxxx\s*xxxx/i);
    }
  });

  test("8. el checklist tiene IDs A11Y-NN únicos y cada uno declara Tipo válido", () => {
    const checklistRows = getSectionContent(checklistContent, "Criterios de accesibilidad");
    const lines = checklistRows
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("|") && l.endsWith("|"));
    expect(lines.length).toBeGreaterThan(2);

    const ids: string[] = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i]
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      const id = cells[0];
      const tipo = cells[4];

      expect(id).toMatch(/^A11Y-\d{2}$/);
      expect(
        VALID_CHECKLIST_TIPOS.has(tipo),
        `Tipo "${tipo}" no pertenece al enum permitido para ${id}`,
      ).toBe(true);
      ids.push(id);
    }

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
