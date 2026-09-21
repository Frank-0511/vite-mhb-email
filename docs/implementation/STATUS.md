# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-29
- Estado: En revisión
- Implementador: Perfil TypeScript/tooling
- Revisor: Revisor técnico
- Rama: `feature/mhb-29`
- Última actualización: 2026-09-20
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-29: Base de ejecución TypeScript)

- **Configuración TS consolidada (2 archivos):** `tsconfig.json` (canónico unificado para todo el proyecto) y `tsconfig.strict.json` (auditoría estricta para archivos `.ts`), activando `strict: true` en `.ts` sin alterar el baseline de los `.js` existentes.
- **Soporte ESLint 10:** integración de `typescript-eslint` en `eslint.config.js` y actualización de `lint-staged` para linting de archivos `.ts`.
- **Módulo y test piloto TS:** `scripts/shared/pilot.ts` y `scripts/shared/pilot.test.ts` escritos en TypeScript estricto, ejecutados nativamente por `bun test` sin emitir artefactos.
- **Control determinista de inventario:** `scripts/inventory/check-migration-inventory.js` y `inventory-baseline.json` con control decreciente de 194 archivos JS/MJS y 2 TS distribuidos en las 5 capas de migración.
- **Cero artefactos transpiled y cero regresión:** build de email (`bun run build`), validación HTML y suite completa 100% verdes.

### Matriz Herramienta → Carga de TypeScript

| Herramienta      | Versión | Forma de cargar TypeScript                                            | Estado        |
| :--------------- | :------ | :-------------------------------------------------------------------- | :------------ |
| **Bun**          | 1.3.13  | Nativo (`bun <file.ts>`, `bun test <file.test.ts>`) sin transpilación | 🟢 Verificado |
| **Node.js**      | v22/v24 | Nativo (`--experimental-strip-types` en Node 22, sin flag en Node 24) | 🟢 Verificado |
| **Vite**         | 8.0.10  | Nativo vía esbuild integrado para módulos y scripts `.ts`             | 🟢 Verificado |
| **Maizzle**      | 1.1.0   | Ejecución sobre Bun/Node consumiendo configs y compilación PostCSS    | 🟢 Verificado |
| **Tailwind CSS** | 3.4.19  | Configurado con globs en `content` que incluyen ficheros `.ts`        | 🟢 Verificado |
| **PostCSS**      | 8.5.12  | Plugins compatibles ejecutados en el flujo de Maizzle/Tailwind        | 🟢 Verificado |
| **ESLint**       | 10.2.1  | Flat config con parser y reglas recomendadas de `typescript-eslint`   | 🟢 Verificado |

### Controles de Calidad

| Control                                       | Comando                                | Resultado                                       |
| :-------------------------------------------- | :------------------------------------- | :---------------------------------------------- |
| Typecheck unificado + estricto                | `bun run typecheck`                    | Verde (0 errores en tsconfig y tsconfig.strict) |
| Pruebas unitarias/integración                 | `bun test`                             | Verde (486 pasados, 0 fallos en 65 archivos)    |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | Verde (0 errores, 0 warnings)                   |
| Control de inventario de migración            | `bun run check:inventory`              | Verde (194 JS / 2 TS conforme)                  |
| Formato de código                             | `bun run format:check`                 | Verde (100% formateado)                         |
| Build pipeline                                | `bun run build`                        | Verde (6 templates compilados)                  |
| Validador HTML email                          | `bun run validate-email`               | Verde (0 errores)                               |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde (`feature/mhb-29`)                        |
| Sincronización de agentes                     | `bun run agents:check`                 | Verde (7 targets correctos)                     |

## Últimas entregas

- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                               |
| :----- | :--------- | :------------------------------------- | :---------------------------------------------------- |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`). |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.    |

## Decisiones y desviaciones vigentes

- **`typescript-eslint` fijado exacto:** Se fijó a `8.70.0` exacta en `package.json` conforme al invariante de versiones sin rangos.
- **`allowImportingTsExtensions: true`:** Habilitado en `tsconfig.json` junto con `noEmit: true` para permitir imports explícitos `.ts` con resolución ESM nativa.
- **`checkJs: false` en `tsconfig.strict.json`:** Permite que archivos `.ts` importen `.js` legados sin aplicar `strict: true` sobre código JS en transición.
- **Baseline de inventario en 194 JS:** Incorpora los 192 archivos de partida de MHB-13 más los 2 archivos de infraestructura del control de inventario (`check-migration-inventory.js` y `check-migration-inventory.test.js`), listados para migrar en MHB-34.

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-29 en `feature/mhb-29`.
- Siguiente tarea del roadmap:
  - MHB-30 (`bloqueado`): Núcleo y validadores en TypeScript (requiere cierre y merge de MHB-29).
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-28 (`desbloqueado`): Modularización de superficies web sobredimensionadas.
