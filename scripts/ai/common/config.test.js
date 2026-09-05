import path from "node:path";
import { describe, expect, test } from "bun:test";
import { assertNoTargetOverlaps, loadConfig } from "./config.mjs";
import { projectRoot } from "./constants.mjs";

describe("config / loadConfig", () => {
  test("carga y valida exitosamente el archivo real agents.config.json", async () => {
    const config = await loadConfig();
    expect(config).toBeDefined();
    expect(Array.isArray(config.targets)).toBe(true);
    expect(config.targets.length).toBeGreaterThan(0);
    expect(Array.isArray(config.gitignore)).toBe(true);

    const agentsMdTarget = config.targets.find((t) => t.targetRelative === "AGENTS.md");
    expect(agentsMdTarget).toBeDefined();
    expect(agentsMdTarget?.mode).toBe("symlink");
  });
});

describe("config / assertNoTargetOverlaps", () => {
  test("lanza error si los targets se anidan o superponen", () => {
    const overlappingTargets = [
      {
        source: path.join(projectRoot, "docs/ai/skills"),
        sourceRelative: "docs/ai/skills",
        target: path.join(projectRoot, "folder"),
        targetRelative: "folder",
        mode: /** @type {'symlink'} */ ("symlink"),
        optional: false,
      },
      {
        source: path.join(projectRoot, "docs/ai/skills"),
        sourceRelative: "docs/ai/skills",
        target: path.join(projectRoot, "folder/subfolder"),
        targetRelative: "folder/subfolder",
        mode: /** @type {'symlink'} */ ("symlink"),
        optional: false,
      },
    ];

    expect(() => assertNoTargetOverlaps(overlappingTargets)).toThrow("se superponen");
  });
});
