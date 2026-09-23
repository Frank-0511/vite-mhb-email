// @ts-check
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import checkFile from "eslint-plugin-check-file";
import {
  BASE_TS_SYNTAX_SELECTORS,
  CONSTANTS_SELECTORS,
  CONTRACT_LITERAL_SELECTORS,
  LOCAL_STORAGE_LITERAL_SELECTOR,
  NODE_BUILTIN_IN_CONTRACTS,
  NO_REEXPORT_SELECTORS,
  OUTSIDE_CONTRACTS_MESSAGE,
  TYPES_ZERO_RUNTIME_SELECTORS,
} from "./scripts/validators/lint-guards/selectors.js";

const TEST_FILES = ["**/*.test.ts", "**/*.spec.ts", "**/*.fixtures.ts", "**/test-helpers.ts"];
const SPECIAL_ROLE_FILES = [
  "**/types.ts",
  "**/types/**",
  "**/constants.ts",
  "**/constants/**",
  "**/index.ts",
];

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Ignora artefactos de compilación, cache y declaraciones de tipos de terceros
  {
    ignores: ["dist/**", "types/**", ".cache/**", ".temp-screenshots/**", "coverage/**"],
  },

  // Reglas recomendadas de ESLint para JavaScript
  js.configs.recommended,

  // Soporte y reglas recomendadas para TypeScript
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),

  // Entorno Node.js — define process, console, __dirname, etc.
  {
    files: [
      "scripts/**/*.{js,mjs,ts}",
      "src/emails/**/*.{js,ts}",
      "vite.config.ts",
      "maizzle.config.js",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Entorno Browser — define window, document, customElements, etc.
  {
    files: ["src/web/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Reglas propias del proyecto
  {
    rules: {
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "off",
      "require-await": "off",
    },
  },

  // Regla no-unused-vars para JS/MJS
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Reglas de calidad y tipo para TypeScript
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.strict.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "no-warning-comments": ["error", { terms: ["@typedef"], location: "anywhere" }],
      "no-restricted-syntax": ["error", ...BASE_TS_SYNTAX_SELECTORS],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: { arguments: false, attributes: false },
        },
      ],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
    },
  },

  // types.ts y types/**: cero runtime (solo declaraciones de tipo)
  {
    files: ["**/types.ts", "**/types/**/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "no-restricted-syntax": [
        "error",
        ...BASE_TS_SYNTAX_SELECTORS,
        ...TYPES_ZERO_RUNTIME_SELECTORS,
      ],
    },
  },

  // constants.ts y constants/**: sin funciones ni declaraciones de tipos
  {
    files: ["**/constants.ts", "**/constants/**/*.ts"],
    ignores: TEST_FILES,
    rules: {
      "no-restricted-syntax": ["error", ...BASE_TS_SYNTAX_SELECTORS, ...CONSTANTS_SELECTORS],
    },
  },

  // Prohibición de magic strings y reexports en scripts de implementación
  {
    files: ["scripts/**/*.ts", "src/emails/**/*.{js,ts}", "vite.config.ts"],
    ignores: ["scripts/shared/contracts/**", ...SPECIAL_ROLE_FILES, ...TEST_FILES],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...BASE_TS_SYNTAX_SELECTORS,
        ...NO_REEXPORT_SELECTORS,
        ...CONTRACT_LITERAL_SELECTORS,
      ],
    },
  },

  // Prohibición de magic strings, localStorage literal y reexports en src/web/** de implementación
  {
    files: ["src/web/**/*.ts"],
    ignores: [...SPECIAL_ROLE_FILES, ...TEST_FILES],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...BASE_TS_SYNTAX_SELECTORS,
        ...NO_REEXPORT_SELECTORS,
        ...CONTRACT_LITERAL_SELECTORS,
        LOCAL_STORAGE_LITERAL_SELECTOR,
      ],
    },
  },

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

  // Convenciones de nombres de archivos y carpetas
  {
    files: ["scripts/**/*.ts", "src/**/*.ts"],
    ignores: ["src/web/shared/utils/**"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{ts,js}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
      "check-file/folder-naming-convention": ["error", { "**/*": "KEBAB_CASE" }],
      "check-file/filename-blocklist": [
        "error",
        {
          "**/helpers.ts": "<domain>-*helpers.ts",
          "**/utils.ts": "<domain>-*utils.ts",
          "**/*-helper.ts": "*-helpers.ts",
          "**/*-utils.ts": "*-utilities.ts",
        },
      ],
    },
  },

  // Desactiva reglas que chocan con Prettier (siempre al final)
  prettierConfig,
];
