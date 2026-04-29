# Refactor and Type Safety Skill

Usa esta skill cuando trabajes en refactors, archivos grandes, extraccion de JS
desde HTML, modularizacion o migracion gradual a type safety.

## Principio

Refactoriza por limites de responsabilidad, no por gusto. Cada refactor debe
reducir riesgo observable: archivos grandes, contratos implicitos, duplicacion
fragil, errores no capturados o acoplamiento entre UI, build y templates.

No mezcles formato, extraccion, cambio de comportamiento y renombres masivos en
un solo cambio.

## Archivos Grandes

Cuando un archivo supere 250-300 lineas o mezcle responsabilidades, tratalo como
candidato a extraccion.

Proceso:

1. identifica responsabilidades actuales;
2. extrae una unidad por vez;
3. mantiene comportamiento observable;
4. agrega JSDoc a los nuevos limites;
5. ejecuta verificacion relevante.

## Extraccion de JS desde HTML

El JS embebido en HTML solo es aceptable para bootstrap minimo, como prevenir
FOUC o aplicar una clase inicial antes de cargar CSS.

Reglas:

- La logica de UI, fetch, editor, localStorage y manipulacion de iframe debe
  vivir en `src/js/`.
- `src/preview.html` debe tender a estructura y carga de assets.
- Al extraer JS, conserva orden de inicializacion.
- Documenta dependencias del DOM.
- Usa helpers para queries DOM obligatorias.
- No repitas `document.getElementById()` sin validar nullabilidad.

## Type Safety Gradual

No migres todo a TypeScript de golpe sin aprobacion explicita.

Ruta preferida:

1. JSDoc completo en codigo tocado.
2. ESLint cubriendo frontend y scripts.
3. `tsconfig.json` con `allowJs` y `checkJs` cuando se introduzca typecheck.
4. Script `bun run typecheck` con `tsc --noEmit`.
5. Migracion selectiva a `.ts` solo en modulos con contratos estables.

Prioridad de tipado:

- APIs internas de Vite;
- schemas de componentes;
- requests/responses de render;
- validadores de email;
- build pipeline;
- CLI actions;
- helpers de filesystem;
- datos de template.

TypeScript o JSDoc no reemplazan validacion runtime. Todo dato proveniente de
JSON, query params, filesystem o requests debe validarse en runtime.

## Frontend Modular

- Mantiene JS modular en `src/js/modules/`.
- Cada modulo debe exponer una API pequena y explicita.
- No mezcles rendering, estado, networking y persistencia en la misma funcion.
- LocalStorage debe usar claves constantes y version si el valor evoluciona.
- Fetch debe manejar `response.ok`, errores de red y respuestas inesperadas.
- Manipulacion de iframe debe estar aislada en un modulo dedicado.
