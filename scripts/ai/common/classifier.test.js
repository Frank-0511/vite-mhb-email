import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { classifySource, classifyTarget } from "./classifier.mjs";
import { projectRoot } from "./constants.mjs";
import { inspectPath } from "./paths.mjs";

describe("classifier / classifySource", () => {
  test("rechaza fuentes que sean symlinks", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "agents-classify-"));
    try {
      const realFile = path.join(tempDir, "real.md");
      await writeFile(realFile, "content", "utf8");
      const symlinkFile = path.join(tempDir, "symlink.md");
      await symlink(realFile, symlinkFile);

      await expect(
        classifySource({ source: symlinkFile, sourceRelative: "symlink.md" }),
      ).rejects.toThrow("no puede ser un enlace");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("classifier / classifyTarget", () => {
  test("detecta targets ausentes y manuales", async () => {
    const targetConfig = {
      source: path.join(projectRoot, "docs/ai/AGENTS.md"),
      sourceRelative: "docs/ai/AGENTS.md",
      target: path.join(projectRoot, "non-existent-target.md"),
      targetRelative: "non-existent-target.md",
      mode: "symlink",
    };
    const sourceInspection = await inspectPath(targetConfig.source);
    const result = await classifyTarget(targetConfig, sourceInspection);
    expect(result.kind).toBe("absent");
  });
});
