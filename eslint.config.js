// @ts-check
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
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
      "scripts/**/*.js",
      "scripts/**/*.ts",
      "vite.config.js",
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

  // Scripts de sincronización de agentes — CLIs ESM con salida de diagnóstico.
  {
    files: ["scripts/ai/*.mjs"],
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
      // Código
      "no-unused-vars": "off",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",

      // CLI hace uso intensivo de console — permitido
      "no-console": "off",

      // Async / await
      "no-return-await": "error",
      "require-await": "warn",
    },
  },

  // Regla no-unused-vars para JS/MJS
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Regla no-unused-vars para TS
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Desactiva reglas que chocan con Prettier (siempre al final)
  prettierConfig,
];
