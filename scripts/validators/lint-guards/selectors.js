// @ts-check
import { builtinModules } from "node:module";

export const API_ROUTE_MESSAGE =
  "No uses rutas de API hardcodeadas. Importa API_ROUTES o helpers de scripts/shared/contracts/routes/api-routes.ts.";

// Magic strings que deben importarse desde scripts/shared/contracts/
export const CONTRACT_LITERAL_SELECTORS = [
  { selector: "Literal[value=/^\\/api\\//]", message: API_ROUTE_MESSAGE },
  { selector: "TemplateElement[value.raw=/^\\/api\\//]", message: API_ROUTE_MESSAGE },
  {
    selector: 'Literal[value="X-ESP-Validation"]',
    message: "Usa HEADER_X_ESP_VALIDATION de scripts/shared/contracts/constants/api-routes.ts.",
  },
  {
    selector: 'Literal[value="RENDER_FAILED"]',
    message: "Usa RENDER_ERROR_CODE de scripts/shared/contracts/constants/render-error.ts.",
  },
  {
    selector: 'Literal[value="email-source-changed"]',
    message: "Usa EVENTS.EMAIL_SOURCE_CHANGED de scripts/shared/contracts/constants/events.ts.",
  },
  {
    selector: 'Literal[value="theme-changed"]',
    message: "Usa EVENTS.THEME_CHANGED de scripts/shared/contracts/constants/events.ts.",
  },
];

export const LOCAL_STORAGE_LITERAL_SELECTOR = {
  selector:
    'CallExpression[callee.property.name=/^(getItem|setItem|removeItem)$/]:matches([callee.object.name="localStorage"], [callee.object.object.name="window"][callee.object.property.name="localStorage"]) > Literal:first-child',
  message:
    "No uses string literals como claves de localStorage. Usa constantes de storage-keys.ts.",
};

// 1. Sin enum: TSEnumDeclaration
export const NO_ENUM_SELECTOR = {
  selector: "TSEnumDeclaration",
  message:
    "No uses enum o const enum. Usa objetos congelados con 'as const' y tipos derivados ('typeof OBJ[keyof typeof OBJ]').",
};

// Reglas sintácticas base para todo archivo TypeScript
export const BASE_TS_SYNTAX_SELECTORS = [NO_ENUM_SELECTOR];

// 3. Sin reexports fuera de index.ts
export const NO_REEXPORT_SELECTORS = [
  {
    selector: "ExportNamedDeclaration[source]",
    message: "Solo los barrels index.ts pueden reexportar desde otros módulos.",
  },
  {
    selector: "ExportAllDeclaration",
    message: "Solo los barrels index.ts pueden usar 'export *'.",
  },
  {
    selector: "ExportNamedDeclaration[declaration=null]",
    message:
      "No reexportes identificadores fuera de index.ts; exporta directamente en la declaración.",
  },
];

// 4. types.ts / types/** sin runtime
export const TYPES_ZERO_RUNTIME_SELECTORS = [
  {
    selector: "VariableDeclaration",
    message:
      "Los archivos types.ts y types/** deben contener solo declaraciones de tipo, sin variables en runtime.",
  },
  {
    selector: "FunctionDeclaration",
    message:
      "Los archivos types.ts y types/** deben contener solo declaraciones de tipo, sin funciones.",
  },
  {
    selector: "ClassDeclaration",
    message:
      "Los archivos types.ts y types/** deben contener solo declaraciones de tipo, sin clases.",
  },
  {
    selector: 'ImportDeclaration[importKind="value"]',
    message: "En archivos types.ts y types/** solo se permiten 'import type'.",
  },
];

// 5. constants.ts / constants/** sin funciones ni declaraciones de tipo
export const CONSTANTS_SELECTORS = [
  {
    selector: ":matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression)",
    message: "Los archivos constants.ts y constants/** no deben contener funciones.",
  },
  {
    selector: ":matches(TSTypeAliasDeclaration, TSInterfaceDeclaration)",
    message: "Las declaraciones de tipos deben ubicarse en types.ts, no en constants.ts.",
  },
];

const nodeBuiltinPattern = `^(node:.*|${builtinModules.join("|")})(/.*)?$`;

export const NODE_BUILTIN_IN_CONTRACTS = {
  regex: nodeBuiltinPattern,
  message: "Los contratos compartidos deben ser puros e independientes de Node.js.",
};

export const OUTSIDE_CONTRACTS_MESSAGE =
  "Los contratos compartidos no deben importar módulos externos a contracts/.";
