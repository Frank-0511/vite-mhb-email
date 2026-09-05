import { describe, expect, test } from "bun:test";
import { gitignoreEnd, gitignoreStart } from "./constants.mjs";
import { expectedGitignoreBlock, replaceGitignoreBlock } from "./gitignore.mjs";

describe("gitignore / expectedGitignoreBlock", () => {
  test("construye el bloque con delimitadores estándar", () => {
    const patterns = ["AGENTS.md", ".agents/skills"];
    const block = expectedGitignoreBlock(patterns);
    expect(block).toBe(`${gitignoreStart}\nAGENTS.md\n.agents/skills\n${gitignoreEnd}`);
  });
});

describe("gitignore / replaceGitignoreBlock", () => {
  test("añade el bloque cuando no existe", () => {
    const block = expectedGitignoreBlock(["item1"]);
    const emptyResult = replaceGitignoreBlock("", block);
    expect(emptyResult).toBe(`${block}\n`);

    const existingContent = "node_modules\n.DS_Store\n";
    const result = replaceGitignoreBlock(existingContent, block);
    expect(result).toBe(`node_modules\n.DS_Store\n\n${block}\n`);
  });

  test("reemplaza un bloque existente limpiamente", () => {
    const initialBlock = expectedGitignoreBlock(["old-item"]);
    const initialContent = `# Cabecera\n${initialBlock}\n# Pie\n`;

    const newBlock = expectedGitignoreBlock(["new-item-1", "new-item-2"]);
    const updated = replaceGitignoreBlock(initialContent, newBlock);

    expect(updated).toBe(`# Cabecera\n${newBlock}\n# Pie\n`);
  });

  test("rechaza bloques incompletos, invertidos o múltiples", () => {
    expect(() => replaceGitignoreBlock(`Some content\n${gitignoreStart}\nitem`, "new")).toThrow(
      "incompleto o desordenado",
    );

    expect(() =>
      replaceGitignoreBlock(`Some content\n${gitignoreEnd}\n${gitignoreStart}`, "new"),
    ).toThrow("incompleto o desordenado");

    const doubleBlock = `${gitignoreStart}\n1\n${gitignoreEnd}\n${gitignoreStart}\n2\n${gitignoreEnd}`;
    expect(() => replaceGitignoreBlock(doubleBlock, "new")).toThrow(
      "más de un bloque administrado",
    );
  });
});
