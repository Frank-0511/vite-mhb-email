# Quality Gates Skill

Usa esta skill cuando trabajes con JSDoc, ESLint, errores, validacion runtime,
dependencias, seguridad o APIs internas.

## JSDoc Obligatorio

Todo codigo nuevo o modificado en `scripts/`, `src/js/` y
`scripts/vite-plugins/` debe tener JSDoc suficiente para entender contratos,
entradas, salidas y errores.

JSDoc es obligatorio en:

- funciones exportadas;
- funciones async;
- funciones que reciban objetos;
- middlewares de Vite;
- helpers de filesystem;
- funciones que parseen JSON;
- funciones que procesen HTML, CSS o delimitadores;
- estructuras compartidas como schemas, template data, render requests e
  issues de validacion.

Ejemplo minimo:

```js
/**
 * Renderiza un template con datos de preview sin modificar variables del ESP.
 *
 * @param {string} filePath Ruta absoluta del template.
 * @param {Record<string, unknown>} data Datos de preview.
 * @param {string} rootDir Raiz del repositorio.
 * @param {boolean} [isPreview=true] Indica si usa CSS de preview.
 * @returns {Promise<string>} HTML renderizado.
 */
export async function compileTemplate(filePath, data, rootDir, isPreview = true) {}
```

No uses `Object` como tipo. Prefiere `Record<string, unknown>`, typedefs o
tipos importados. Evita `any`; si es inevitable, explica la razon.

## ESLint Estricto

ESLint debe cubrir:

- `scripts/**/*.js`;
- `src/js/**/*.js`;
- `vite.config.js`;
- `maizzle.config.js`;
- cualquier archivo JS nuevo.

Reglas esperadas:

- `no-unused-vars`: error;
- `eqeqeq`: error;
- `prefer-const`: error;
- `no-var`: error;
- `no-console`: permitido en CLI/build, restringido en frontend salvo errores
  intencionales;
- `require-await`: warning o error segun contexto;
- compatibilidad con Prettier.

No agregues codigo nuevo en `src/js/` si no queda cubierto por `bun run lint`.
No desactives reglas inline salvo razon tecnica local documentada.

## Manejo de Errores

Todo script de build, CLI, exportacion, mail o Vite API debe fallar de forma
explicita y recuperable.

Reglas:

- Captura errores en boundaries: entrypoints, comandos CLI, middlewares y
  operaciones de archivo.
- Conserva el stack o mensaje original al agregar contexto.
- En build, restaura estado temporal aunque falle una etapa.
- No hagas `catch` silencioso.
- No retornes HTML de error sin status HTTP correcto.
- Valida body JSON, query params, rutas, nombres de templates, componentes y
  variantes.
- Evita path traversal resolviendo inputs dentro del directorio esperado.

## Seguridad

- No escribas fuera del workspace salvo autorizacion explicita.
- No imprimas secretos de `.env`.
- No subas ni generes archivos con credenciales.
- No ejecutes comandos destructivos sin autorizacion explicita.
- No agregues dependencias sin justificar DX, seguridad, mantenimiento y peso.

## Dependencias

Antes de agregar una dependencia:

1. confirma que Bun/Vite/Maizzle/Node no resuelven el problema;
2. revisa si aumenta complejidad del build o runtime;
3. evita dependencias para tareas simples de string, path o filesystem;
4. documenta por que vale la pena.
