# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-40
- Estado: En revisión
- Implementador: Perfil gobernanza/documentación
- Revisor: Revisor independiente (orquestador)
- Rama: `feature/mhb-40`
- Última actualización: 2026-09-24
- Contrato activo: `docs/implementation/PLAN.md` (MHB-40)

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-40: Gobernanza de agentes y revisión independiente)

- **Hechos de implementación:**
  1. Corregidas 5 contradicciones históricas en `docs/ai/` y `PLAN.md` (eliminadas referencias a JS/allowJs, typedefs, any, `storage-keys.js` e `IMPLEMENTATION-PLAN.md`).
  2. Incorporadas 6 reglas de gobernanza en `AGENTS.md`, `email-quality-gates`, `task-verification` y `task-status-management` (supresiones registradas, `.ts` obligatorio, criterios con comando, actualización de rutas, baseline de dist y CHANGELOG unreleased).
  3. Creadas skills canónicas `task-review` (procedimiento del revisor independiente) y `release-management` (congelamiento de alcance, checklist Go/No-Go y SemVer) con sus `agents/openai.yaml`.
  4. Sincronizados y verificados los adaptadores en los 7 targets declarados mediante `bun run agents:sync` y `bun run agents:check`.
  5. Documentadas entradas retroactivas de MHB-37, MHB-39 y MHB-40 en `CHANGELOG.md` bajo `[Unreleased]` y ejecutado ensayo de `task-review` sobre el diff de MHB-39.
- **Riesgos residuales:**
  1. Riesgo bajo de que un implementador omita registrar una supresión temporal; mitigado por el procedimiento de auditoría profunda de diff en `task-review`.
- **Bloqueos y desviaciones:**
  - Sin bloqueos ni desviaciones vigentes.

### Controles de Calidad

| Control                 | Comando                                                                                                                | Resultado                      |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| Comprobación de rama    | `bun run check:task-branch`                                                                                            | Pasó (feature/mhb-40)          |
| Barrido contradicciones | `grep -rnE "Conservar JavaScript ESM\|No migrar globalmente\|typedefs\|IMPLEMENTATION-PLAN\|storage-keys\.js" docs/ai` | Pasó (0 hallazgos)             |
| Linting Markdown        | `bun run lint:md`                                                                                                      | Pasó (0 errores en 87 files)   |
| Formato de código       | `bun run format:check`                                                                                                 | Pasó (100% Prettier)           |
| Adaptadores de agentes  | `bun run agents:check`                                                                                                 | Pasó (7 targets declarados)    |
| Typecheck unificado     | `bun run typecheck`                                                                                                    | Pasó (0 errores)               |
| Suite de pruebas        | `bun run test`                                                                                                         | Pasó (598 tests, 78 suites)    |
| Linting completo        | `bun run lint`                                                                                                         | Pasó (HTML, JS, MD, JSON, CSS) |
| Build y salida dist     | `bun run build`                                                                                                        | Pasó (6 templates, 0 diff)     |
| Validación email        | `bun run validate-email`                                                                                               | Pasó (0 errores)               |
| Diff de Git             | `git diff --check`                                                                                                     | Pasó (limpio)                  |

### Evidencia de Validación

#### Contradicciones corregidas

| Archivo                                              | Hallazgo previo                              | Acción aplicada                                   |
| :--------------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| `docs/ai/skills/email-refactor-type-safety/SKILL.md` | Conservar JS ESM / no migrar globalmente     | Reemplazado por cierre TS estricto y nuevos `.ts` |
| `docs/ai/skills/email-quality-gates/SKILL.md`        | typedefs y explicar cualquier any            | Prohibido any y `@typedef` en `.ts`               |
| `docs/ai/AGENTS.md`                                  | `storage-keys.js` / `IMPLEMENTATION-PLAN.md` | Corregido a `.ts` y `PLAN.md`                     |
| `docs/implementation/PLAN.md`                        | `a11y-check.ts`                              | Corregido a `check-a11y.ts`                       |

#### Ensayo de `task-review` sobre MHB-39

- **Diff (`2f3600b..b512883`):** 0 supresiones no autorizadas (`eslint-disable`, `@ts-ignore`), 0 archivos `.js`/`.mjs` nuevos.
- **Salida:** 0 diff en `dist/*.html`, variables ESP `{{ }}` preservadas.
- **Árbol:** `file-tree.test.ts` pasando al 100% (límites prod ≤ 250 / test ≤ 400 respetados).
- **Veredicto del ensayo:** Aprobado.

## Últimas entregas

- MHB-39: `Completada` el 2026-09-24; estandarización de 48 renombres `git mv` (cero prefijos redundantes), barrels `index.ts` puros, test de árbol `file-tree.test.ts`, linting con tipos en ESLint con 0 hallazgos y `asyncHandler` seguro.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad                   | Handoff                                               |
| :----- | :---------- | :-------------------------- | :---------------------------------------------------- |
| MHB-40 | En revisión | Gobernanza y revisión       | Entrega completa a revisión técnica independiente.    |
| MHB-39 | Completada  | Nombres y linting con tipos | Verificación completa y aceptada en `feature/mhb-39`. |

## Decisiones y desviaciones vigentes

- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: revisión técnica independiente (orquestador) aplicando la skill `task-review`.
- Siguiente tarea del roadmap:
  - MHB-41 (`bloqueada` hasta completar MHB-40): Gate del contrato de salida y validadores en CI.
