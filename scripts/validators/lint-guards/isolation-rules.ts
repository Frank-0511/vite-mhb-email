import type { Linter } from "eslint";
import { NODE_BUILTIN_IN_CONTRACTS, OUTSIDE_CONTRACTS_MESSAGE } from "./selectors.ts";

const TEST_FILES = ["**/*.test.ts", "**/*.spec.ts", "**/*.fixtures.ts", "**/test-helpers.ts"];

export const ISOLATION_CONFIGS: Linter.Config[] = [
  // Aislamiento de contracts (raíz): prohibido Node.js y subir de directorio
  {
    files: ["scripts/shared/contracts/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NODE_BUILTIN_IN_CONTRACTS,
            { regex: "^\\.\\./", message: OUTSIDE_CONTRACTS_MESSAGE },
          ],
        },
      ],
    },
  },

  // Aislamiento de contracts (subcarpetas): se permite ../ entre subcarpetas, no salir de contracts/
  {
    files: ["scripts/shared/contracts/*/**/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NODE_BUILTIN_IN_CONTRACTS,
            { regex: "^\\.\\./\\.\\./", message: OUTSIDE_CONTRACTS_MESSAGE },
          ],
        },
      ],
    },
  },

  // Aislamiento de web: prohibido importar barrel scripts/shared o utilidades de Node
  {
    files: ["src/web/**/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^node:.*",
              message: "No uses módulos de Node.js en código frontend (src/web).",
            },
            {
              regex: "scripts/shared(/(?!contracts(/|$)).*)?$",
              message:
                "En src/web solo se permite importar de scripts/shared/contracts/..., no del barrel ni de utilidades internas de scripts/shared/.",
            },
          ],
        },
      ],
    },
  },
];
