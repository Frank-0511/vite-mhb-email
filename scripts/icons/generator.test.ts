/**
 * @fileoverview Pruebas unitarias del generador de iconos PNG (scripts/icons/generator.ts).
 */

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  generateIcon,
  isValidHexColor,
  isValidIconSize,
  isValidIconSuffix,
  isValidLucideIcon,
  kebabToPascal,
} from "./generator.ts";

let tempDir = "";

beforeEach(() => {
  tempDir = join(tmpdir(), `icon-gen-test-${randomUUID()}`);
  mkdirSync(tempDir, { recursive: true });
});

afterEach(() => {
  if (tempDir && existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("Type guards del generador de iconos", () => {
  test("kebabToPascal convierte nombres kebab a PascalCase", () => {
    expect(kebabToPascal("rocket")).toBe("Rocket");
    expect(kebabToPascal("circle-check")).toBe("CircleCheck");
    expect(kebabToPascal("party-popper")).toBe("PartyPopper");
  });

  test("isValidLucideIcon valida iconos existentes e inexistentes", () => {
    expect(isValidLucideIcon("rocket")).toBe(true);
    expect(isValidLucideIcon("circle-check")).toBe(true);
    expect(isValidLucideIcon("nonexistent-icon-xyz")).toBe(false);
    expect(isValidLucideIcon("")).toBe(false);
    expect(isValidLucideIcon(123)).toBe(false);
    expect(isValidLucideIcon(null)).toBe(false);
  });

  test("isValidHexColor valida códigos hexadecimales de 6 dígitos sin '#'", () => {
    expect(isValidHexColor("fbbf24")).toBe(true);
    expect(isValidHexColor("121212")).toBe(true);
    expect(isValidHexColor("FFFFFF")).toBe(true);
    expect(isValidHexColor("#fbbf24")).toBe(false);
    expect(isValidHexColor("fff")).toBe(false);
    expect(isValidHexColor("12345g")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  test("isValidIconSize valida tamaños enteros positivos", () => {
    expect(isValidIconSize(24)).toBe(true);
    expect(isValidIconSize("24")).toBe(true);
    expect(isValidIconSize(0)).toBe(false);
    expect(isValidIconSize(-5)).toBe(false);
    expect(isValidIconSize(2.5)).toBe(false);
    expect(isValidIconSize("abc")).toBe(false);
  });

  test("isValidIconSuffix valida sufijos con formato v<entero positivo>", () => {
    expect(isValidIconSuffix("v2")).toBe(true);
    expect(isValidIconSuffix("v1")).toBe(true);
    expect(isValidIconSuffix("v10")).toBe(true);
    expect(isValidIconSuffix("v0")).toBe(false);
    expect(isValidIconSuffix("vx")).toBe(false);
    expect(isValidIconSuffix("2")).toBe(false);
    expect(isValidIconSuffix("v")).toBe(false);
    expect(isValidIconSuffix("")).toBe(false);
    expect(isValidIconSuffix(null)).toBe(false);
    expect(isValidIconSuffix(123)).toBe(false);
  });
});

describe("generateIcon — Generación y rasterizado @2x", () => {
  test("produce PNG transparente, dimensiones dobles de size y nombre correcto para rocket/fbbf24/24", () => {
    const result = generateIcon({
      icon: "rocket",
      color: "fbbf24",
      size: 24,
      iconsDir: tempDir,
    });

    expect(result.fileName).toBe("lucide-rocket-fbbf24.png");
    expect(result.filePath).toBe(join(tempDir, "lucide-rocket-fbbf24.png"));
    expect(result.width).toBe(48);
    expect(result.height).toBe(48);
    expect(result.overwritten).toBe(false);

    // Comprobar que el archivo se escribió en disco
    expect(existsSync(result.filePath)).toBe(true);
    const diskBuffer = readFileSync(result.filePath);

    // Cabecera PNG estándar: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    const pngMagicHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(diskBuffer.subarray(0, 8)).toEqual(pngMagicHeader);

    // Comprobar dimensiones en el chunk IHDR (bytes 16-19 width, 20-23 height)
    const widthFromHeader = diskBuffer.readUInt32BE(16);
    const heightFromHeader = diskBuffer.readUInt32BE(20);
    expect(widthFromHeader).toBe(48);
    expect(heightFromHeader).toBe(48);
  });

  test("rechaza icono inexistente con mensaje descriptivo", () => {
    expect(() =>
      generateIcon({
        icon: "icono-falso",
        color: "fbbf24",
        size: 24,
        iconsDir: tempDir,
      }),
    ).toThrow('El icono "icono-falso" no existe en Lucide Icons');
  });

  test("rechaza color hex inválido con mensaje descriptivo", () => {
    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "#fbbf24",
        size: 24,
        iconsDir: tempDir,
      }),
    ).toThrow("El color debe ser un valor hexadecimal de 6 dígitos sin '#'");

    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "fff",
        size: 24,
        iconsDir: tempDir,
      }),
    ).toThrow("El color debe ser un valor hexadecimal de 6 dígitos sin '#'");
  });

  test("rechaza tamaño inválido con mensaje descriptivo", () => {
    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "fbbf24",
        size: -10,
        iconsDir: tempDir,
      }),
    ).toThrow("El tamaño debe ser un entero positivo");
  });

  test("no sobrescribe un PNG existente sin --force", () => {
    const existingFile = join(tempDir, "lucide-rocket-fbbf24.png");
    writeFileSync(existingFile, Buffer.from("existing-content"));

    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "fbbf24",
        size: 24,
        force: false,
        iconsDir: tempDir,
      }),
    ).toThrow("ya existe");

    // El contenido original no fue alterado
    expect(readFileSync(existingFile, "utf-8")).toBe("existing-content");
  });

  test("sobrescribe un PNG existente si se pasa force: true", () => {
    const existingFile = join(tempDir, "lucide-rocket-fbbf24.png");
    writeFileSync(existingFile, Buffer.from("existing-content"));

    const result = generateIcon({
      icon: "rocket",
      color: "fbbf24",
      size: 24,
      force: true,
      iconsDir: tempDir,
    });

    expect(result.overwritten).toBe(true);
    const newContent = readFileSync(existingFile);
    expect(newContent).not.toEqual(Buffer.from("existing-content"));
    expect(result.width).toBe(48);
  });

  test("produce PNG con sufijo de versión y dimensiones dobles para --suffix v2", () => {
    const result = generateIcon({
      icon: "rocket",
      color: "fbbf24",
      size: 24,
      suffix: "v2",
      iconsDir: tempDir,
    });

    expect(result.fileName).toBe("lucide-rocket-fbbf24-v2.png");
    expect(result.filePath).toBe(join(tempDir, "lucide-rocket-fbbf24-v2.png"));
    expect(result.width).toBe(48);
    expect(result.height).toBe(48);
    expect(existsSync(result.filePath)).toBe(true);
  });

  test("rechaza sufijo de versión inválido con mensaje descriptivo", () => {
    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "fbbf24",
        size: 24,
        suffix: "vx",
        iconsDir: tempDir,
      }),
    ).toThrow('El sufijo de versión debe tener el formato "v<entero positivo>"');

    expect(() =>
      generateIcon({
        icon: "rocket",
        color: "fbbf24",
        size: 24,
        suffix: "v0",
        iconsDir: tempDir,
      }),
    ).toThrow('El sufijo de versión debe tener el formato "v<entero positivo>"');
  });
});

describe("generate-icon CLI subprocess", () => {
  const cliPath = join(import.meta.dirname ?? ".", "generate-icon.ts");

  test("ejecución con argumentos válidos sale con código 0", () => {
    const proc = spawnSync(
      process.execPath,
      [
        cliPath,
        "--icon",
        "rocket",
        "--color",
        "fbbf24",
        "--size",
        "24",
        "--dir",
        tempDir,
        "--force",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(0);
    expect(proc.stdout).toContain("Icono generado exitosamente");
  });

  test("ejecución con --suffix v2 produce el archivo y sale con código 0", () => {
    const proc = spawnSync(
      process.execPath,
      [
        cliPath,
        "--icon",
        "rocket",
        "--color",
        "fbbf24",
        "--size",
        "24",
        "--suffix",
        "v2",
        "--dir",
        tempDir,
        "--force",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(0);
    expect(proc.stdout).toContain("lucide-rocket-fbbf24-v2.png");
  });

  test("ejecución con sufijo inválido sale con código 1", () => {
    const proc = spawnSync(
      process.execPath,
      [cliPath, "--icon", "rocket", "--color", "fbbf24", "--size", "24", "--suffix", "vx"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(1);
    expect(proc.stderr).toContain("Error");
  });

  test("ejecución con icono inexistente sale con código 1", () => {
    const proc = spawnSync(
      process.execPath,
      [cliPath, "--icon", "icono-inexistente", "--color", "fbbf24", "--size", "24"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(1);
    expect(proc.stderr).toContain("Error");
  });

  test("ejecución con color inválido sale con código 1", () => {
    const proc = spawnSync(
      process.execPath,
      [cliPath, "--icon", "rocket", "--color", "#invalido", "--size", "24"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(1);
    expect(proc.stderr).toContain("Error");
  });

  test("ejecución con tamaño inválido sale con código 1", () => {
    const proc = spawnSync(
      process.execPath,
      [cliPath, "--icon", "rocket", "--color", "fbbf24", "--size", "-5"],
      {
        cwd: process.cwd(),
        encoding: "utf-8",
      },
    );

    expect(proc.status).toBe(1);
    expect(proc.stderr).toContain("Error");
  });

  test("ejecución con --help sale con código 0", () => {
    const proc = spawnSync(process.execPath, [cliPath, "--help"], {
      cwd: process.cwd(),
      encoding: "utf-8",
    });

    expect(proc.status).toBe(0);
    expect(proc.stdout).toContain("EmailForge — Generador de iconos PNG");
  });
});
