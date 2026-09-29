/**
 * @fileoverview Pruebas unitarias del guard de no-sobrescritura de iconos (scripts/icons/guard.ts).
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkIconNoOverwrite } from "./guard.ts";

let tempRepo = "";
let iconsDir = "";

beforeEach(() => {
  tempRepo = join(tmpdir(), `icon-guard-test-${randomUUID()}`);
  mkdirSync(tempRepo, { recursive: true });

  // Inicializar un repositorio git temporal con master
  execSync("git init -b master", { cwd: tempRepo, stdio: "ignore" });
  execSync('git config user.name "Test User"', { cwd: tempRepo, stdio: "ignore" });
  execSync('git config user.email "test@example.com"', { cwd: tempRepo, stdio: "ignore" });

  iconsDir = join(tempRepo, "src/emails/assets/icons");
  mkdirSync(iconsDir, { recursive: true });

  // Crear un PNG inicial y commitear en master
  writeFileSync(join(iconsDir, "lucide-rocket-fbbf24.png"), Buffer.from("v1-bytes"));
  writeFileSync(join(iconsDir, "README.md"), "# Documentación");
  execSync("git add .", { cwd: tempRepo, stdio: "ignore" });
  execSync('git commit -m "feat: initial icons"', { cwd: tempRepo, stdio: "ignore" });
});

afterEach(() => {
  if (tempRepo && existsSync(tempRepo)) {
    rmSync(tempRepo, { recursive: true, force: true });
    tempRepo = "";
  }
});

describe("checkIconNoOverwrite con fixtures", () => {
  test("un PNG existente modificado hace fallar el guard", () => {
    // Modificar el PNG existente
    writeFileSync(join(iconsDir, "lucide-rocket-fbbf24.png"), Buffer.from("v2-modified-bytes"));

    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(1);
    expect(summary.modifiedFiles).toContain("src/emails/assets/icons/lucide-rocket-fbbf24.png");
    expect(summary.message).toContain("Se detectaron 1 icono(s) PNG existente(s) modificado(s)");
    expect(summary.message).toContain("inmutables por caché de jsDelivr");
  });

  test("un PNG nuevo añadido pasa el guard con 0 errores", () => {
    // Añadir un nuevo PNG (no modificar el existente)
    writeFileSync(join(iconsDir, "lucide-bell-121212.png"), Buffer.from("new-icon-bytes"));

    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(0);
    expect(summary.modifiedFiles.length).toBe(0);
    expect(summary.message).toContain("Integridad de iconos OK");
  });

  test("modificar README.md u otro archivo no-PNG no hace fallar el guard", () => {
    writeFileSync(join(iconsDir, "README.md"), "# Documentación actualizada");

    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(0);
    expect(summary.modifiedFiles.length).toBe(0);
  });

  test("si master no existe pero origin/master sí, usa el respaldo y pasa con 0 errores", () => {
    // Renombrar master a feature/test y crear refs/remotes/origin/master
    execSync("git branch -m feature/test", { cwd: tempRepo, stdio: "ignore" });
    execSync("git update-ref refs/remotes/origin/master HEAD", { cwd: tempRepo, stdio: "ignore" });

    // Confirmar que master no existe localmente
    expect(() =>
      execSync("git rev-parse --verify master", { cwd: tempRepo, stdio: "pipe" }),
    ).toThrow();

    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(0);
    expect(summary.message).toContain("origin/master");
  });

  test("si master no existe pero origin/master sí, un PNG modificado sigue fallando", () => {
    // Renombrar master a feature/test y crear refs/remotes/origin/master
    execSync("git branch -m feature/test", { cwd: tempRepo, stdio: "ignore" });
    execSync("git update-ref refs/remotes/origin/master HEAD", { cwd: tempRepo, stdio: "ignore" });

    // Modificar el PNG
    writeFileSync(
      join(iconsDir, "lucide-rocket-fbbf24.png"),
      Buffer.from("v2-modified-via-origin"),
    );

    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(1);
    expect(summary.modifiedFiles).toContain("src/emails/assets/icons/lucide-rocket-fbbf24.png");
    expect(summary.message).toContain("origin/master");
  });

  test("si ni la rama base ni su respaldo existen, devuelve error nombrando a ambas", () => {
    const summary = checkIconNoOverwrite({
      projectRoot: tempRepo,
      baseRef: "rama-inexistente",
    });

    expect(summary.verified).toBe(false);
    expect(summary.errors).toBe(1);
    expect(summary.message).toContain("'rama-inexistente'");
    expect(summary.message).toContain("'origin/rama-inexistente'");
  });

  test("en el repositorio actual contra master pasa con 0 errores", () => {
    const summary = checkIconNoOverwrite({
      projectRoot: process.cwd(),
      baseRef: "master",
    });

    expect(summary.verified).toBe(true);
    expect(summary.errors).toBe(0);
    expect(summary.modifiedFiles.length).toBe(0);
  });
});
