// @ts-check
/**
 * @fileoverview Validador de variables ESP `{{ var }}` para EmailForge Toolkit.
 *
 * Compara el template fuente (`src/emails/templates/<name>/index.html`) con su
 * `data.json` y reporta:
 *   - **missing**: variables referenciadas en el template que no existen en
 *     `data.json`. Severidad WARNING. No bloquea el build.
 *   - **unused**: claves de `data.json` que el template no usa. Severidad INFO.
 *
 * Las variables ESP intencionales que el ESP completa en producción (por
 * ejemplo, `unsubscribe_url`, `web_version_url`) pueden declararse en el
 * frontmatter del template bajo `espVariables` para evitar falsos positivos.
 *
 * Reglas de extracción:
 *   - Se ignoran delimitadores Maizzle (`[[ ]]`, `[[[ ]]]`) y Handlebars
 *     triple-stash (`{{{ }}}`).
 *   - Las variables dentro de `{{#each}}…{{this}}…{{/each}}` se ignoran.
 *   - El frontmatter (entre `---`) no se analiza como cuerpo del template.
 *   - Solo claves de primer nivel de `data.json` se consideran.
 *
 * El helper es puro: no toca filesystem ni DOM. Los consumidores (preview,
 * build/export, validador email) deciden cuándo y cómo reportar.
 */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const ESP_VAR_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const TRIPLE_STASH_RE = /\{\{\{[\s\S]*?\}\}\}/g;
const MAIZZE_DOUBLE_RE = /\[\[[\s\S]*?\]\]/g;
const MAIZZE_TRIPLE_RE = /\[\[\[[\s\S]*?\]\]\]/g;

/** @type {Set<string>} Claves reservadas del frontmatter del template. */
const FRONTMATTER_METADATA_KEYS = new Set([
  "title",
  "previewText",
  "titleTemplate",
  "emailType",
  "espVariables",
]);

/**
 * Elimina todos los bloques `{{#each …}}…{{/each}}` (no anidados) del cuerpo
 * del template. La apertura y el cierre se eliminan junto con el contenido,
 * evitando reportar `{{ this }}` interno como variable ESP referenciada.
 *
 * @param {string} body
 * @returns {string}
 */
function stripEachBlocks(body) {
  let output = "";
  let index = 0;
  while (index < body.length) {
    const openAt = body.indexOf("{{#each", index);
    if (openAt === -1) {
      output += body.slice(index);
      break;
    }
    const closeOfOpen = body.indexOf("}}", openAt);
    if (closeOfOpen === -1) {
      output += body.slice(index);
      break;
    }
    const closeBlock = body.indexOf("{{/each}}", closeOfOpen);
    if (closeBlock === -1) {
      output += body.slice(index);
      break;
    }
    // Conservar todo antes del bloque y avanzar después de {{/each}}.
    output += body.slice(index, openAt);
    index = closeBlock + "{{/each}}".length;
  }
  return output;
}

/**
 * Extrae los identificadores ESP `{{ var }}` presentes en un template fuente.
 *
 * @param {string} source Contenido del `index.html` del template.
 * @returns {Set<string>} Conjunto de nombres únicos (primer uso gana orden).
 */
export function extractEspVariables(source) {
  if (typeof source !== "string" || source.length === 0) {
    return new Set();
  }

  const body = stripFrontmatter(source);
  return collectEspVariablesInBody(body);
}

/**
 * Devuelve el cuerpo del template sin el bloque frontmatter inicial.
 *
 * @param {string} source
 * @returns {string}
 */
function stripFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return source;
  const after = source.slice(match[0].length);
  return after.startsWith("\r\n") || after.startsWith("\n") ? after.slice(1) : after;
}

/**
 * Recolecta variables ESP dentro de un cuerpo de template ya sin frontmatter.
 *
 * @param {string} body
 * @returns {Set<string>}
 */
function collectEspVariablesInBody(body) {
  // Eliminar zonas que NO son ESP: triple-stash, maizzle [[ ]] y [[[ ]]].
  // El orden importa: primero lo más específico (triple) para no destruir
  // accidentalmente pares `{{ }}` legítimos dentro de un bloque Maizzle.
  const sanitized = body
    .replace(TRIPLE_STASH_RE, "")
    .replace(MAIZZE_TRIPLE_RE, "")
    .replace(MAIZZE_DOUBLE_RE, "");

  // Eliminar bloques `{{#each …}}…{{/each}}` para ignorar `{{ this }}` interno.
  const eachStripped = stripEachBlocks(sanitized);

  const found = new Set();
  for (const match of eachStripped.matchAll(ESP_VAR_RE)) {
    found.add(match[1]);
  }
  return found;
}

/**
 * Parsea un frontmatter YAML-lite del template y devuelve sus claves declaradas.
 * Implementación mínima para MHB-06: solo entiende claves planas y
 * `espVariables` en formato lista YAML o inline JSON-like.
 *
 * Devuelve `{}` si el frontmatter falta o es ilegible; no lanza.
 *
 * @param {string} source
 * @returns {{ espVariables?: string[] }}
 */
export function parseEspFrontmatter(source) {
  if (typeof source !== "string") return {};
  const match = source.match(FRONTMATTER_RE);
  if (!match) return {};

  const block = match[1];
  // 1) Formato lista YAML:
  //    espVariables:
  //      - foo
  //      - bar
  const listMatch = block.match(/^espVariables\s*:\s*(?:\r?\n)((?:\s*-\s*[^\r\n]+\r?\n?)+)/im);
  if (listMatch) {
    const items = listMatch[1]
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*-\s*/, "").trim())
      .filter((line) => line.length > 0)
      .map((line) => unquote(line));
    return { espVariables: items };
  }

  // 2) Formato inline JSON-like: `espVariables: ["a", "b"]`
  const inlineMatch = block.match(/^espVariables\s*:\s*\[(.*?)\]/im);
  if (inlineMatch) {
    const items = inlineMatch[1]
      .split(",")
      .map((item) => unquote(item.trim()))
      .filter((item) => item.length > 0);
    return { espVariables: items };
  }

  return {};
}

/**
 * Quita comillas simples o dobles envolventes de un token.
 *
 * @param {string} value
 * @returns {string}
 */
function unquote(value) {
  if (!value) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * @typedef {Object} EspValidationResult
 * @property {string[]} missing Variables referenciadas en el template que no
 *   existen en `data` (descontando `espVariables` intencionales).
 * @property {string[]} unused Claves de primer nivel de `data` que el
 *   template no referencia.
 */

/**
 * Compara un template fuente con su `data.json` y devuelve el conjunto de
 * variables faltantes y sobrantes. Las variables listadas en
 * `espVariables` (frontmatter) se excluyen del grupo "missing".
 *
 * @param {Object} params
 * @param {string} params.source Contenido del `index.html` del template.
 * @param {unknown} params.data Objeto JSON con los datos disponibles.
 * @returns {EspValidationResult}
 */
export function validateEspVariables({ source, data }) {
  const referenced = extractEspVariables(source);
  const { espVariables = [] } = parseEspFrontmatter(source);
  const intentional = new Set(espVariables);

  const dataKeys =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.keys(/** @type {Record<string, unknown>} */ (data)).filter((key) => {
          const value = /** @type {Record<string, unknown>} */ (data)[key];
          // Las claves cuyo valor es un objeto (configuración, metadata) no
          // son candidatas a "unused": rara vez se referencian directamente.
          return (
            (value === null || typeof value !== "object") &&
            !FRONTMATTER_METADATA_KEYS.has(key) &&
            !frontmatterKeys(source).has(key)
          );
        })
      : [];

  const referencedForCompare = new Set([...referenced].filter((name) => !intentional.has(name)));

  const dataKeySet = new Set(dataKeys);

  const missing = [];
  for (const name of referencedForCompare) {
    if (!dataKeySet.has(name)) missing.push(name);
  }

  const unused = [];
  for (const key of dataKeys) {
    if (!referenced.has(key)) unused.push(key);
  }

  // Orden estable para facilitar diffs y snapshots en tests.
  missing.sort();
  unused.sort();

  return { missing, unused };
}

/**
 * Extrae nombres de claves planas del frontmatter para no tratar metadatos
 * como variables ESP del data.json.
 *
 * @param {string} source
 * @returns {Set<string>}
 */
function frontmatterKeys(source) {
  const match = typeof source === "string" ? source.match(FRONTMATTER_RE) : null;
  if (!match) return new Set();

  const keys = new Set(FRONTMATTER_METADATA_KEYS);
  for (const line of match[1].split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:/);
    if (keyMatch) keys.add(keyMatch[1]);
  }
  return keys;
}
