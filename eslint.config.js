// @ts-check
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Reglas recomendadas de ESLint
  js.configs.recommended,

  // Entorno Node.js — define process, console, __dirname, etc.
  {
    files: ["scripts/**/*.js", "vite.config.js", "maizzle.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Entorno Browser — define window, document, customElements, etc.
  {
    files: ["src/web/**/*.js"],
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
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
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

  // Desactiva reglas que chocan con Prettier (siempre al final)
  prettierConfig,
];
