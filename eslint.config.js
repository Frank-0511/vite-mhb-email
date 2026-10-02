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
  NO_REEXPORT_SELECTORS,
  TYPES_ZERO_RUNTIME_SELECTORS,
} from "./scripts/validators/lint-guards/selectors.ts";
import { ISOLATION_CONFIGS } from "./scripts/validators/lint-guards/isolation-rules.ts";

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
      "maizzle.config.ts",
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
    },
  },

  // Reglas para JS/MJS
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "require-await": "error",
    },
  },

  // Reglas de calidad y tipo para TypeScript
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
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
      "require-await": "off",
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

  // Bloques de aislamiento para contracts y frontend
  ...ISOLATION_CONFIGS,

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
