/**
 * @fileoverview Pruebas de verificación de guardas ESLint para higiene de tipos y contratos.
 * Valida programáticamente que eslint.config.js rechace cualquier violación de:
 * 1. no-explicit-any
 * 2. consistent-type-imports
 * 3. no-warning-comments (JSDoc typedef)
 * 4. no-restricted-syntax (rutas /api/, X-ESP-Validation, RENDER_FAILED, email-source-changed, theme-changed)
 * 5. no-restricted-syntax (localStorage con clave literal en src/web/**)
 * 6. no-restricted-imports (node:* y ascendentes ../* en contracts)
 * 7. no-restricted-imports (node:* y barrel scripts/shared en src/web/**)
 */

import { describe, expect, test } from "bun:test";
import { ESLint } from "eslint";
import eslintConfig from "../../../eslint.config.js";

const typeAwareRulesOff = {
  "@typescript-eslint/no-floating-promises": "off",
  "@typescript-eslint/no-misused-promises": "off",
  "@typescript-eslint/await-thenable": "off",
  "@typescript-eslint/no-redundant-type-constituents": "off",
  "@typescript-eslint/require-await": "off",
  "@typescript-eslint/return-await": "off",
} as const;

const eslint = new ESLint({
  overrideConfig: [
    {
      files: ["**/*.ts"],
      languageOptions: { parserOptions: { project: null } },
      rules: typeAwareRulesOff,
    },
  ],
});

/**
 * Helper para obtener los ruleId con severidad error reportados por ESLint sobre un snippet.
 */
async function lintSnippet(code: string, filePath: string): Promise<string[]> {
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((r) =>
    r.messages.filter((m) => m.severity === 2).map((m) => m.ruleId ?? ""),
  );
}

describe("ESLint Quality & Contract Guards", () => {
  describe("Type hygiene guards", () => {
    test("rechaza el uso de any explícito", async () => {
      const errors = await lintSnippet("export const val: any = 123;\n", "scripts/temp-check.ts");
      expect(errors).toContain("@typescript-eslint/no-explicit-any");
    });

    test("acepta unknown y tipos estrictos", async () => {
      const errors = await lintSnippet(
        "export const val: unknown = 123;\n",
        "scripts/temp-check.ts",
      );
      expect(errors).not.toContain("@typescript-eslint/no-explicit-any");
    });

    test("obliga a usar import type cuando solo se consume un tipo", async () => {
      const errors = await lintSnippet(
        'import { MyType } from "./types";\nexport const x: MyType = 1;\n',
        "src/web/temp-check.ts",
      );
      expect(errors).toContain("@typescript-eslint/consistent-type-imports");
    });

    test("rechaza anotaciones @typedef en comentarios JSDoc", async () => {
      const errors = await lintSnippet(
        "/** @typedef {string} CustomAlias */\nexport const x = 1;\n",
        "scripts/temp-check.ts",
      );
      expect(errors).toContain("no-warning-comments");
    });
  });

  describe("Restricted syntax: Magic strings", () => {
    test("rechaza rutas de API hardcodeadas como literales de string en web", async () => {
      const errors = await lintSnippet('export const url = "/api/data";\n', "src/web/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza rutas de API hardcodeadas en template literals", async () => {
      const errors = await lintSnippet("export const url = `/api/render`;\n", "scripts/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza el header hardcodeado X-ESP-Validation", async () => {
      const errors = await lintSnippet(
        'export const h = "X-ESP-Validation";\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza el código de error RENDER_FAILED hardcodeado", async () => {
      const errors = await lintSnippet('export const err = "RENDER_FAILED";\n', "scripts/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza el evento email-source-changed hardcodeado", async () => {
      const errors = await lintSnippet(
        'export const ev = "email-source-changed";\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza el evento theme-changed hardcodeado", async () => {
      const errors = await lintSnippet('export const ev = "theme-changed";\n', "src/web/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });
  });

  describe("Restricted syntax: localStorage literals in web", () => {
    test("rechaza localStorage.getItem con clave string literal", async () => {
      const errors = await lintSnippet('localStorage.getItem("app-theme");\n', "src/web/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza localStorage.setItem con clave string literal", async () => {
      const errors = await lintSnippet(
        'localStorage.setItem("app-theme", "dark");\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("rechaza window.localStorage con clave string literal", async () => {
      const errors = await lintSnippet(
        'window.localStorage.removeItem("app-theme");\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("permite localStorage cuando usa identificador o constante", async () => {
      const errors = await lintSnippet(
        'const KEY = "k";\nlocalStorage.getItem(KEY);\n',
        "src/web/dummy.ts",
      );
      expect(errors).not.toContain("no-restricted-syntax");
    });
  });

  describe("Restricted imports: contracts purity", () => {
    test("prohíbe importar node:* en contracts", async () => {
      const errors = await lintSnippet(
        'import fs from "node:fs";\nexport const f = fs;\n',
        "scripts/shared/contracts/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("prohíbe importar builtins de Node (path, fs) en contracts", async () => {
      const errors = await lintSnippet(
        'import path from "path";\nexport const p = path;\n',
        "scripts/shared/contracts/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("prohíbe imports relativos ascendentes en contracts", async () => {
      const errors = await lintSnippet(
        'import { x } from "../constants";\nexport const c = x;\n',
        "scripts/shared/contracts/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("permite imports hermanos dentro de contracts", async () => {
      const errors = await lintSnippet(
        'import { THEME } from "./theme";\nexport const t = THEME;\n',
        "scripts/shared/contracts/dummy.ts",
      );
      expect(errors).not.toContain("no-restricted-imports");
    });

    test("prohíbe subpaths de builtins de Node (fs/promises) en contracts", async () => {
      const errors = await lintSnippet(
        'import { readFile } from "fs/promises";\nexport const r = readFile;\n',
        "scripts/shared/contracts/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("permite imports entre subcarpetas de contracts", async () => {
      const errors = await lintSnippet(
        'import { THEME } from "../constants/theme";\nexport const t = THEME;\n',
        "scripts/shared/contracts/types/dummy.ts",
      );
      expect(errors).not.toContain("no-restricted-imports");
    });

    test("prohíbe salir de contracts desde una subcarpeta", async () => {
      const errors = await lintSnippet(
        'import { x } from "../../utils";\nexport const u = x;\n',
        "scripts/shared/contracts/types/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });
  });

  describe("Restricted imports: web isolation", () => {
    test("prohíbe importar módulos de Node.js en src/web/**", async () => {
      const errors = await lintSnippet(
        'import fs from "node:fs";\nexport const f = fs;\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("prohíbe importar el barrel scripts/shared en src/web/**", async () => {
      const errors = await lintSnippet(
        'import { c } from "../../scripts/shared";\nexport const col = c;\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("prohíbe importar utilidades de Node de scripts/shared en src/web/**", async () => {
      const errors = await lintSnippet(
        'import { readFile } from "../../scripts/shared/fs-utils";\nexport const r = readFile;\n',
        "src/web/dummy.ts",
      );
      expect(errors).toContain("no-restricted-imports");
    });

    test("permite importar contratos puros desde src/web/**", async () => {
      const errors = await lintSnippet(
        'import { API_ROUTES } from "../../scripts/shared/contracts/api-routes";\nexport const r = API_ROUTES;\n',
        "src/web/dummy.ts",
      );
      expect(errors).not.toContain("no-restricted-imports");
    });
  });

  describe("TSEnumDeclaration guard", () => {
    test("prohíbe el uso de enum", async () => {
      const errors = await lintSnippet("export enum Direction { Up, Down }\n", "src/web/dummy.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("permite objetos as const con tipos derivados", async () => {
      const errors = await lintSnippet(
        'export const DIRECTION = { UP: "up", DOWN: "down" } as const;\nexport type Direction = (typeof DIRECTION)[keyof typeof DIRECTION];\n',
        "src/web/dummy.ts",
      );
      expect(errors).not.toContain("no-restricted-syntax");
    });
  });

  describe("Strict barrels: no reexports outside index.ts", () => {
    test("prohíbe export { x } from en archivos que no son index.ts", async () => {
      const errors = await lintSnippet(
        'export { foo } from "./foo.ts";\n',
        "src/web/features/preview/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe export * from en archivos que no son index.ts", async () => {
      const errors = await lintSnippet(
        'export * from "./foo.ts";\n',
        "src/web/features/preview/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe export { x } con identificadores importados o locales", async () => {
      const errors = await lintSnippet(
        "const a = 1;\nexport { a };\n",
        "scripts/vite/services/render/dummy.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("permite reexports en archivos index.ts", async () => {
      const errors = await lintSnippet(
        'export { foo } from "./foo.ts";\n',
        "src/web/features/preview/index.ts",
      );
      expect(errors).not.toContain("no-restricted-syntax");
    });
  });

  describe("types.ts zero-runtime guard", () => {
    test("prohíbe declaraciones de variables en types.ts", async () => {
      const errors = await lintSnippet("export const X = 1;\n", "src/web/types.ts");
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe funciones en types.ts", async () => {
      const errors = await lintSnippet(
        "export function getFoo(): void {}\n",
        "scripts/shared/contracts/types/theme.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe clases en types.ts", async () => {
      const errors = await lintSnippet(
        "export class Foo {}\n",
        "src/web/features/library/types.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe imports de valor en types.ts", async () => {
      const errors = await lintSnippet(
        'import { CONST } from "./constants.ts";\nexport type T = typeof CONST;\n',
        "src/web/types.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("permite import type y declaraciones puras de tipo en types.ts", async () => {
      const errors = await lintSnippet(
        'import type { CONST } from "./constants.ts";\nexport type T = (typeof CONST)[keyof typeof CONST];\nexport interface I { name: string; }\n',
        "src/web/types.ts",
      );
      expect(errors).not.toContain("no-restricted-syntax");
    });
  });

  describe("constants.ts zero-functions-and-types guard", () => {
    test("prohíbe declaraciones de función en constants.ts", async () => {
      const errors = await lintSnippet(
        "export function calc() { return 1; }\n",
        "src/web/constants.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe arrow functions en constants.ts", async () => {
      const errors = await lintSnippet(
        "export const calc = () => 1;\n",
        "scripts/shared/contracts/constants/theme.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe declaraciones de tipos en constants.ts", async () => {
      const errors = await lintSnippet(
        'export type Color = "red" | "blue";\n',
        "src/web/constants.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("prohíbe interfaces en constants.ts", async () => {
      const errors = await lintSnippet(
        "export interface Config { key: string; }\n",
        "src/web/constants.ts",
      );
      expect(errors).toContain("no-restricted-syntax");
    });

    test("permite constantes y objetos as const en constants.ts", async () => {
      const errors = await lintSnippet(
        'export const COLOR = { RED: "red", BLUE: "blue" } as const;\n',
        "src/web/constants.ts",
      );
      expect(errors).not.toContain("no-restricted-syntax");
    });
  });

  describe("ESLint ignores policy", () => {
    test("los bloques con files no contienen ignores fuera de tests y roles reservados", () => {
      const allowed = new Set([
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.fixtures.ts",
        "**/test-helpers.ts",
        "**/types.ts",
        "**/types/**",
        "**/constants.ts",
        "**/constants/**",
        "**/index.ts",
        "scripts/shared/contracts/**",
        "src/web/shared/utils/**",
      ]);

      for (const block of eslintConfig) {
        if (!block.files || !block.ignores) continue;
        for (const pattern of block.ignores) {
          const isAllowed =
            allowed.has(pattern) || pattern.endsWith(".test.ts") || pattern.endsWith(".spec.ts");
          if (!isAllowed) {
            throw new Error(`Ignore no permitido: ${pattern}`);
          }
          expect(isAllowed).toBe(true);
        }
      }
    });
  });
});
