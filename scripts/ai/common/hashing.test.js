import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { generatedMarker, projectRoot } from "./constants.mjs";
import { copyMarker, expectedCopy, hashFile, hashSource, isManagedCopy } from "./hashing.mjs";

describe("hashing / marcas de copia administrada", () => {
  test("copyMarker e isManagedCopy identifican marcas generadas", async () => {
    const marker = copyMarker("docs/ai/AGENTS.md", "abcdef123456");
    expect(marker).toContain(generatedMarker);
    expect(marker).toContain("source=docs/ai/AGENTS.md");
    expect(marker).toContain("sha256=abcdef123456");

    const tempDir = await mkdtemp(path.join(os.tmpdir(), "agents-hashing-"));
    try {
      const managedFile = path.join(tempDir, "managed.md");
      await writeFile(managedFile, `${marker}\n# Contenido del archivo`, "utf8");
      expect(await isManagedCopy(managedFile)).toBe(true);

      const unmanagedFile = path.join(tempDir, "unmanaged.md");
      await writeFile(unmanagedFile, "# Contenido manual sin marca", "utf8");
      expect(await isManagedCopy(unmanagedFile)).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("expectedCopy rechaza fuentes no-archivos o targets no-markdown", async () => {
    await expect(
      expectedCopy({
        source: path.join(projectRoot, "docs/ai/skills"),
        sourceRelative: "docs/ai/skills",
        target: path.join(projectRoot, "some-dir"),
        targetRelative: "some-dir",
      }),
    ).rejects.toThrow("solo admite archivos");

    await expect(
      expectedCopy({
        source: path.join(projectRoot, "docs/ai/AGENTS.md"),
        sourceRelative: "docs/ai/AGENTS.md",
        target: path.join(projectRoot, "output.txt"),
        targetRelative: "output.txt",
      }),
    ).rejects.toThrow("requiere un target Markdown");
  });
});

describe("hashing / hashFile y hashSource", () => {
  test("computan SHA-256 determinista para archivos y directorios", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "agents-hashsource-"));
    try {
      const fileA = path.join(tempDir, "a.txt");
      await writeFile(fileA, "hello world", "utf8");

      const hashA1 = await hashFile(fileA);
      const hashA2 = await hashSource(fileA);
      expect(hashA1).toBe(hashA2);
      expect(hashA1.length).toBe(64);

      // Subdirectorio con archivo adicional
      const subDir = path.join(tempDir, "sub");
      await mkdir(subDir);
      const fileB = path.join(subDir, "b.txt");
      await writeFile(fileB, "second file", "utf8");

      const dirHash1 = await hashSource(tempDir);
      const dirHash2 = await hashSource(tempDir);
      expect(dirHash1).toBe(dirHash2);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
