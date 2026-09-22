// @ts-check
import { describe, expect, test } from "bun:test";
import {
  BYTES_PER_KB,
  bytesToKB,
  formatBytes,
  GMAIL_MAX_SAFE_BYTES,
  GMAIL_WARNING_THRESHOLD_BYTES,
} from "./format-helpers.js";

describe("format-helpers (formateo y umbrales de tamaño en bytes)", () => {
  test("constantes de umbral y unidades están correctamente calculadas", () => {
    expect(BYTES_PER_KB).toBe(1024);
    expect(GMAIL_MAX_SAFE_BYTES).toBe(102 * 1024);
    expect(GMAIL_WARNING_THRESHOLD_BYTES).toBe(100 * 1024);
  });

  describe("bytesToKB", () => {
    test("convierte bytes exactos a KB con 2 decimales por defecto", () => {
      expect(bytesToKB(1024)).toBe("1.00");
      expect(bytesToKB(2048)).toBe("2.00");
      expect(bytesToKB(1536)).toBe("1.50");
    });

    test("respeta el número de decimales especificado", () => {
      expect(bytesToKB(1536, 1)).toBe("1.5");
      expect(bytesToKB(1536, 3)).toBe("1.500");
      expect(bytesToKB(1536, 0)).toBe("2");
    });

    test("gestiona valores nulos, negativos o no finitos devolviendo cero formateado", () => {
      expect(bytesToKB(0)).toBe("0.00");
      expect(bytesToKB(-100)).toBe("0.00");
      expect(bytesToKB(NaN)).toBe("0.00");
      expect(bytesToKB(Infinity)).toBe("0.00");
    });
  });

  describe("formatBytes", () => {
    test("formatea bytes sin unidad mayor cuando es menor a 1 KB", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(0)).toBe("0 B");
    });

    test("formatea KB para valores entre 1 KB y 1 MB", () => {
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(2560)).toBe("2.50 KB");
    });

    test("formatea MB para valores mayores o iguales a 1 MB", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
      expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.50 MB");
    });

    test("respeta la opción useKBOnly forzando siempre KB", () => {
      expect(formatBytes(512, { useKBOnly: true })).toBe("0.50 KB");
      expect(formatBytes(1024 * 1024, { useKBOnly: true })).toBe("1024.00 KB");
      expect(formatBytes(0, { useKBOnly: true })).toBe("0.00 KB");
    });

    test("respeta la opción includeSpace para omitir el espacio antes de la unidad", () => {
      expect(formatBytes(1024, { includeSpace: false })).toBe("1.00KB");
      expect(formatBytes(512, { includeSpace: false })).toBe("512B");
      expect(formatBytes(512, { useKBOnly: true, includeSpace: false })).toBe("0.50KB");
    });

    test("maneja entradas no finitas o negativas", () => {
      expect(formatBytes(-50)).toBe("0 B");
      expect(formatBytes(NaN)).toBe("0 B");
      expect(formatBytes(-50, { useKBOnly: true, includeSpace: false })).toBe("0.00KB");
    });
  });
});
