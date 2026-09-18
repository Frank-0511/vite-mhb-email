# Inventario de pruebas unitarias — MHB-19

Mapa `regla → tests` y `helper → tests` de EmailForge Toolkit. Es la evidencia
requerida por MHB-19: cada regla de compatibilidad tiene al menos un caso
positivo y uno negativo, y cada helper crítico tiene casos felices y de borde.

MHB-19 no impone un porcentaje global de cobertura; el criterio es pertinencia
sobre comportamiento observable, no sobre detalles de implementación.

Suite de referencia: `bun run test` → 477 pruebas en 51 archivos, 0 fallos.

## Reglas de compatibilidad

Fuente: `scripts/validators/email-rules/rules/`.

Organización de los tests, siguiendo la convención sibling del repo:

- `rules/<regla>.test.js` — casos borde de esa regla, junto a su módulo.
  `document.js` agrupa cuatro reglas, así que `document.test.js` las cubre a
  las cuatro.
- `rules.test.js` — lo que es propiedad del registro, no de una regla: la tabla
  `cases` de pares positivo/negativo, la comprobación de que ninguna regla
  registrada quede fuera de esa tabla, la unicidad de `id`/severidad/descripción
  y el aislamiento de fallos de `runRules`.
- `test-fixtures.js` — `cleanHtml`, contextos temporales y escritura de
  templates fuente, compartidos por ambos niveles.

| Regla                   | Severidad | Positivo + negativo                               | Casos borde                                                                                          |
| ----------------------- | --------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `img-dimensions`        | ERROR     | tabla `cases` en `rules.test.js`                  | atributo ausente nombrado individualmente; una incidencia por imagen; comillas simples               |
| `img-alt`               | WARNING   | tabla `cases` en `rules.test.js`                  | `alt` ausente vs `alt=""` vs `alt` en blanco                                                         |
| `css-unsupported-props` | ERROR     | tabla `cases` en `rules.test.js`                  | una incidencia por propiedad y por función; ignora inline fuera de `<style>` y prefijos `-webkit-`   |
| `doctype-present`       | ERROR     | tabla `cases` en `rules.test.js`                  | espacios previos y mayúsculas aceptados; doctype XHTML rechazado                                     |
| `meta-charset`          | WARNING   | tabla `cases` en `rules.test.js`                  | `UTF-8`, `utf8`; rechaza `iso-8859-1`                                                                |
| `link-targets`          | WARNING   | tabla `cases` en `rules.test.js`                  | omite `{{ }}`, merge tags Mailchimp y `mailto:`; distingue `href=""` de `href="#"`                   |
| `max-width-check`       | WARNING   | tabla `cases` en `rules.test.js`                  | límite inclusivo 700px y 43.75rem; 701px y 44rem reportan; sin clase `.max-w-*` no opina             |
| `color-scheme-meta`     | INFO      | tabla `cases` en `rules.test.js`                  | dark mode declarado con meta no reporta; selector `.dark-` lo dispara                                |
| `unsubscribe-link`      | WARNING   | tabla `cases` en `rules.test.js`                  | template `emailType: transactional` exento; variantes en español; marketing sin baja reporta         |
| `no-js-in-email`        | ERROR     | tabla `cases` en `rules.test.js`                  | una incidencia por `<script>` con su línea; `<noscript>` no confunde                                 |
| `nested-tables-depth`   | INFO      | tabla `cases` en `rules.test.js`                  | 4 niveles admitidos, 5 reportan; tablas hermanas no acumulan profundidad                             |
| `css-class-vs-inline`   | INFO      | tabla `cases` en `rules.test.js`                  | calla con inline presente y pocas reglas; >20 reglas con <5 inline reporta; sin `<style>` no opina   |
| `esp-variables`         | WARNING   | en `rules/esp-variables.test.js` (necesita disco) | sin template fuente no opina; `data.json` ilegible = datos vacíos; template y datos alineados callan |

Los casos borde de la última columna viven en el test hermano de cada regla.

## Helpers críticos

| Helper                                      | Tests                                            | Casos felices                                            | Casos borde                                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/shared/paths.js`                   | `scripts/shared/paths.test.js`                   | rutas centrales absolutas; trío por template             | raíz relativa normalizada; nombre con extensión y nombre vacío sin normalizar                                                                                                          |
| `scripts/shared/built-templates.js`         | `scripts/shared/built-templates.test.js`         | filtra `.html` y ordena; lee HTML tal cual               | `dist/` ausente y vacío; `.htm`/`.html.bak` excluidos; archivo inexistente propaga error                                                                                               |
| `scripts/shared/component-folders.js`       | `scripts/shared/component-folders.test.js`       | layouts + partials + subcarpetas anidadas                | solo carpetas (no archivos); partials inexistente devuelve las dos raíces                                                                                                              |
| `scripts/shared/env.js`                     | `scripts/shared/env.test.js`                     | carga pares y detecta faltantes                          | comentarios y líneas sin `=`; comillas y espacios; `=` internos; no sobreescribe entorno; placeholders del `.env.example`; valor vacío; el resultado no expone credenciales            |
| `scripts/shared/handlebars.js`              | `scripts/shared/handlebars.test.js`              | sustitución Legacy, `applyHandlebars`, `getTemplateData` | escape HTML; `null`/`undefined`/objetos preservados; data no objeto; triple stash; `[[ ]]` Maizzle intacto; plantilla inválida devuelve el HTML; `data.json` ausente o ilegible = `{}` |
| `scripts/esp/esp-frontmatter.js`            | `scripts/esp/esp-frontmatter.test.js`            | lista YAML e inline JSON-like; claves planas             | CRLF; bloque fuera de la primera línea; lista vacía; entradas no string; ítems de lista no son claves                                                                                  |
| `scripts/esp/esp-data-filter.js`            | `scripts/esp/esp-data-filter.test.js`            | conserva escalares de primer nivel                       | descarta objetos/arrays, metadata reservada y claves del frontmatter; entradas no objeto                                                                                               |
| `scripts/validators/email-rules/context.js` | `scripts/validators/email-rules/context.test.js` | línea, fragmento y extracción de `<style>`               | índice negativo y fuera de rango; elipsis solo si hay más HTML; `<STYLE>` con atributos; no arrastra contenido externo                                                                 |

## Helpers ya cubiertos antes de MHB-19

Se revisaron y se consideran suficientes; MHB-19 no los modifica.

| Helper                             | Tests                                   |
| ---------------------------------- | --------------------------------------- |
| `scripts/shared/path-safety.js`    | `scripts/shared/path-safety.test.js`    |
| `scripts/esp/esp-extractor.js`     | `scripts/esp/esp-extractor.test.js`     |
| `scripts/esp/esp-variables.js`     | `scripts/esp/esp-variables.test.js`     |
| `scripts/esp/esp-sources.js`       | `scripts/esp/esp-sources.test.js`       |
| `scripts/build/build-helper.js`    | `scripts/build/build-helper.test.js`    |
| `scripts/cli/helpers.js`           | `scripts/cli/helpers.test.js`           |
| `scripts/export/renderers.js`      | `scripts/export/renderers.test.js`      |
| `scripts/generators/archetypes.js` | `scripts/generators/archetypes.test.js` |
| `scripts/ai/common/*`              | `scripts/ai/common/*.test.js`           |

## Fuera de alcance de MHB-19

- Entrypoints y orquestadores (`scripts/build/build.js`, `scripts/cli/cli.js`,
  `scripts/export/index.js`, `scripts/mail/*`): flujo extremo a extremo, es
  materia de MHB-20.
- Módulos de UI en `src/web/**` sin test propio: son vistas, no helpers
  críticos; su verificación manual corresponde a MHB-14.
- Porcentaje global de cobertura: excluido explícitamente por el contrato.
