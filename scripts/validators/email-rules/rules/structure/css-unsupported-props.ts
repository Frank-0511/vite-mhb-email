import {
  extractInlineStyles,
  extractStyleContent,
  parseCssDeclarations,
  Severity,
  type CssDeclaration,
  type Issue,
  type Rule,
  type SeverityType,
} from "../../context.ts";

// Textos de clientes verificados el 2026-11-23 con el mapa de soporte de
// @emailens/engine 0.19.3 (datos de caniemail, MIT), fuera del repo. "Outlook de
// escritorio clásico" corresponde a outlook-windows-legacy (motor Word).

const RULE_ID = "css-unsupported-props";
const WORD_ENGINE = "Outlook de escritorio clásico (motor Word)";
const LAYOUT_HINT = "Reemplazar con alternativa compatible (ej: flex → table layout)";
const DEGRADE_HINT =
  "Eliminar la propiedad o aceptar que el cliente la ignore sin romper el layout";
const FUNCTION_HINT = "Usar valores estáticos en lugar de funciones CSS dinámicas";

interface UnsupportedEntry {
  /** Nombre exacto de la propiedad; null si la entrada busca una función en cualquier valor. */
  property: string | null;
  /** Patrón del valor. Sin patrón, cualquier valor de la propiedad coincide. */
  valuePattern?: RegExp;
  level: SeverityType;
  name: string;
  clients: string;
  hint: string;
}

const UNSUPPORTED: UnsupportedEntry[] = [
  // ERROR: rompen el layout.
  {
    property: "display",
    valuePattern: /^(?:inline-)?(?:flex|grid)(?![\w-])/i,
    level: Severity.ERROR,
    name: "display: flex/grid/inline-flex/inline-grid",
    clients: `${WORD_ENGINE}, Gmail (parcial)`,
    hint: LAYOUT_HINT,
  },
  {
    property: "float",
    level: Severity.ERROR,
    name: "float",
    clients: WORD_ENGINE,
    hint: LAYOUT_HINT,
  },
  {
    property: "position",
    valuePattern: /^(?:absolute|fixed|sticky)$/i,
    level: Severity.ERROR,
    name: "position: absolute/fixed/sticky",
    clients: `${WORD_ENGINE}, Gmail`,
    hint: LAYOUT_HINT,
  },
  { property: "gap", level: Severity.ERROR, name: "gap", clients: WORD_ENGINE, hint: LAYOUT_HINT },
  {
    property: "row-gap",
    level: Severity.ERROR,
    name: "row-gap",
    clients: WORD_ENGINE,
    hint: LAYOUT_HINT,
  },
  {
    property: "column-gap",
    level: Severity.ERROR,
    name: "column-gap",
    clients: WORD_ENGINE,
    hint: LAYOUT_HINT,
  },
  {
    property: "grid-gap",
    level: Severity.ERROR,
    name: "grid-gap",
    clients: WORD_ENGINE,
    hint: LAYOUT_HINT,
  },
  {
    property: null,
    valuePattern: /(?<![\w-])calc\s*\(/i,
    level: Severity.ERROR,
    name: "calc()",
    clients: `${WORD_ENGINE}, Yahoo, Gmail (parcial)`,
    hint: FUNCTION_HINT,
  },
  {
    property: null,
    valuePattern: /(?<![\w-])var\s*\(/i,
    level: Severity.ERROR,
    name: "var() (CSS custom properties)",
    clients: "Outlook, Gmail y Yahoo (sin variables CSS)",
    hint: FUNCTION_HINT,
  },
  {
    property: null,
    valuePattern: /(?<![\w-])clamp\s*\(/i,
    level: Severity.ERROR,
    name: "clamp()",
    clients: WORD_ENGINE,
    hint: FUNCTION_HINT,
  },
  // WARNING: solo degradan.
  {
    property: "opacity",
    level: Severity.WARNING,
    name: "opacity",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "transform",
    level: Severity.WARNING,
    name: "transform",
    clients: `${WORD_ENGINE}, Gmail, Yahoo`,
    hint: DEGRADE_HINT,
  },
  {
    property: "transition",
    level: Severity.WARNING,
    name: "transition",
    clients: `${WORD_ENGINE}, Gmail, Yahoo (parcial)`,
    hint: DEGRADE_HINT,
  },
  {
    property: "animation",
    level: Severity.WARNING,
    name: "animation",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "aspect-ratio",
    level: Severity.WARNING,
    name: "aspect-ratio",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "object-fit",
    level: Severity.WARNING,
    name: "object-fit",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "box-shadow",
    level: Severity.WARNING,
    name: "box-shadow",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: null,
    valuePattern: /(?<![\w-])linear-gradient\s*\(/i,
    level: Severity.WARNING,
    name: "linear-gradient()",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "filter",
    level: Severity.WARNING,
    name: "filter",
    clients: WORD_ENGINE,
    hint: DEGRADE_HINT,
  },
  {
    property: "backdrop-filter",
    level: Severity.WARNING,
    name: "backdrop-filter",
    clients: `${WORD_ENGINE}, Gmail, Yahoo`,
    hint: DEGRADE_HINT,
  },
];

type Origin = "style" | "inline";

function matches(entry: UnsupportedEntry, { property, value }: CssDeclaration): boolean {
  if (entry.property !== null && entry.property !== property) return false;
  return entry.valuePattern ? entry.valuePattern.test(value) : true;
}

function describeOrigins(origins: Set<Origin>): string {
  if (origins.has("style") && origins.has("inline")) return "en <style> y en estilo inline";
  return origins.has("style") ? "en <style>" : "en estilo inline";
}

function toIssue(entry: UnsupportedEntry, origins: Set<Origin>): Issue {
  const kind = entry.property === null ? "Función CSS" : "Propiedad CSS";
  return {
    ruleId: RULE_ID,
    severity: entry.level,
    message: `${kind} "${entry.name}" no soportada en: ${entry.clients}; aparece ${describeOrigins(origins)}`,
    hint: entry.hint,
  };
}

const cssUnsupportedProps: Rule = {
  id: RULE_ID,
  severity: Severity.ERROR,
  description:
    "Detecta propiedades CSS no soportadas en clientes de email en <style> y estilos inline (ERROR si rompen el layout, WARNING si solo degradan)",
  check(html: string): Issue[] {
    const found = new Map<UnsupportedEntry, Set<Origin>>();
    const record = (css: string, origin: Origin): void => {
      for (const declaration of parseCssDeclarations(css)) {
        for (const entry of UNSUPPORTED) {
          if (!matches(entry, declaration)) continue;
          const origins = found.get(entry) ?? new Set<Origin>();
          origins.add(origin);
          found.set(entry, origins);
        }
      }
    };
    record(extractStyleContent(html), "style");
    for (const inlineStyle of extractInlineStyles(html)) record(inlineStyle, "inline");
    return [...found].map(([entry, origins]) => toIssue(entry, origins));
  },
};

export default cssUnsupportedProps;
