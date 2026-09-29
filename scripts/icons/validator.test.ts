/**
 * @fileoverview Pruebas unitarias del validador de referencias de iconos (scripts/icons/validator.ts).
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ICON_NAME_CONVENTION_REGEX } from "../shared/contracts/constants/email-assets.ts";
import { validateIconReferences } from "./validator.ts";

let tempDir = "";
let emailsDir = "";
let iconsDir = "";

beforeEach(() => {
  tempDir = join(tmpdir(), `icon-val-test-${randomUUID()}`);
  emailsDir = join(tempDir, "src/emails");
  iconsDir = join(tempDir, "src/emails/assets/icons");
  mkdirSync(iconsDir, { recursive: true });
});

afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("ICON_NAME_CONVENTION_REGEX", () => {
  test("valida nombres que siguen el formato lucide-<icono>-<hex6>", () => {
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24")).toBe(true);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-circle-check-121212")).toBe(true);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-party-popper-fbbf24")).toBe(true);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-triangle-alert-ef4444")).toBe(true);
  });

  test("valida nombres con sufijo de versión positivo -v<N>", () => {
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24-v2")).toBe(true);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24-v1")).toBe(true);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-circle-check-121212-v10")).toBe(true);
  });

  test("rechaza nombres que no cumplen la convención", () => {
    expect(ICON_NAME_CONVENTION_REGEX.test("rocket")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fff")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-#fbbf24")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide--fbbf24")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24-vx")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24-v0")).toBe(false);
    expect(ICON_NAME_CONVENTION_REGEX.test("lucide-rocket-fbbf24-v")).toBe(false);
  });
});

describe("validateIconReferences con fixtures", () => {
  test("un template con un name sin PNG hace fallar el validador", () => {
    const templateDir = join(emailsDir, "templates/test-template");
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      join(templateDir, "index.html"),
      `<div><x-email-icon name="lucide-missing-icon-fbbf24" size="24" /></div>`,
    );

    const summary = validateIconReferences(tempDir);
    expect(summary.errors).toBe(1);
    expect(summary.issues[0].type).toBe("missing-file");
    expect(summary.issues[0].iconName).toBe("lucide-missing-icon-fbbf24");
    expect(summary.issues[0].message).toContain("Icono PNG no encontrado en disco");
  });

  test("un template con name que viola la convención hace fallar el validador", () => {
    const templateDir = join(emailsDir, "templates/invalid-template");
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      join(templateDir, "index.html"),
      `<div><x-email-icon name="invalid_icon_name" size="24" /></div>`,
    );

    const summary = validateIconReferences(tempDir);
    expect(summary.errors).toBe(1);
    expect(summary.issues[0].type).toBe("invalid-format");
    expect(summary.issues[0].iconName).toBe("invalid_icon_name");
  });

  test("un template con name que incluye extensión .png se rechaza con mensaje explícito", () => {
    const templateDir = join(emailsDir, "templates/png-ext-template");
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      join(templateDir, "index.html"),
      `<div><x-email-icon name="lucide-rocket-fbbf24.png" size="24" /></div>`,
    );

    const summary = validateIconReferences(tempDir);
    expect(summary.errors).toBe(1);
    expect(summary.issues[0].type).toBe("invalid-format");
    expect(summary.issues[0].iconName).toBe("lucide-rocket-fbbf24.png");
    expect(summary.issues[0].message).toContain("no debe incluir la extensión .png");
  });

  test("un template con <x-email-icon> sin atributo name hace fallar el validador", () => {
    const templateDir = join(emailsDir, "templates/no-name-template");
    mkdirSync(templateDir, { recursive: true });

    writeFileSync(
      join(templateDir, "index.html"),
      `<div><x-email-icon size="24" alt="sin nombre" /></div>`,
    );

    const summary = validateIconReferences(tempDir);
    expect(summary.errors).toBe(1);
    expect(summary.issues[0].type).toBe("missing-name");
  });

  test("un template con referencias válidas que existen en disco pasa con 0 errores", () => {
    const templateDir = join(emailsDir, "templates/valid-template");
    mkdirSync(templateDir, { recursive: true });

    // Crear el PNG en la carpeta de iconos
    writeFileSync(
      join(iconsDir, "lucide-rocket-fbbf24.png"),
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );

    writeFileSync(
      join(templateDir, "index.html"),
      `<div>
        <x-email-icon name="lucide-rocket-fbbf24" size="24" />
      </div>`,
    );

    const summary = validateIconReferences(tempDir);
    expect(summary.errors).toBe(0);
    expect(summary.checkedReferences).toBe(1);
    expect(summary.checkedFiles).toBe(1);
    expect(summary.issues.length).toBe(0);
  });

  test("valida exitosamente todas las referencias reales en el proyecto", () => {
    const summary = validateIconReferences(process.cwd());
    expect(summary.errors).toBe(0);
    expect(summary.checkedReferences).toBe(12);
    expect(summary.checkedFiles).toBe(3);
  });
});
