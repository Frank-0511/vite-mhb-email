# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-13
- Estado: Completada
- Implementador: Perfil tipos/rendimiento
- Revisor: Revisor técnico
- Rama: `feature/mhb-13`
- Última actualización: 2026-09-20
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-13: Baseline completo de tipos y rendimiento)

- **Inventario exhaustivo:** 190 archivos JS/MJS cubiertos en 23 directorios (root, scripts, src/web, tests).
- **Límites ambientales:** declaraciones en `types/` (`assets.d.ts`, `bun-test.d.ts`, `cdn.d.ts`, `vite-env.d.ts`).
- **Typecheck JS verde:** `tsc --noEmit` completó con 0 errores; cero directivas `@ts-ignore` introducidas.
- **Rendimiento medido:** script `scripts/perf/measure-benchmarks.js` reproducible (con tests unitarios).
- **Rendimiento comparativo:** Bun (1.3.13) vs Node.js (v24.3.0) medido en Darwin arm64 (Apple M1 Pro).

### Mediciones de Rendimiento (Darwin arm64, commit `619a425`, 3 iteraciones)

| Tarea / Comando     | Runtime | Comando Ejecutado                                 | Mediana (ms) | Rango [Min - Max] (ms) |
| :------------------ | :------ | :------------------------------------------------ | :----------: | :--------------------: |
| **Typecheck (tsc)** | Bun     | `bun ./node_modules/typescript/bin/tsc --noEmit`  |   1431 ms    |    [1402 - 1433] ms    |
| **Typecheck (tsc)** | Node.js | `node ./node_modules/typescript/bin/tsc --noEmit` |   1474 ms    |    [1431 - 1482] ms    |
| **Build Pipeline**  | Bun     | `bun scripts/build/build.js`                      |   4119 ms    |    [4103 - 4141] ms    |
| **Build Pipeline**  | Node.js | `node scripts/build/build.js`                     |   4155 ms    |    [4093 - 4183] ms    |
| **Email Validator** | Bun     | `bun scripts/validators/validate-email-html.js`   |    63 ms     |      [63 - 64] ms      |
| **Email Validator** | Node.js | `node scripts/validators/validate-email-html.js`  |    81 ms     |      [81 - 82] ms      |
| **Unit Test Suite** | Bun     | `bun test`                                        |   5975 ms    |    [5974 - 5989] ms    |

### Controles de Calidad

| Control                                    | Comando                                           | Resultado                         |
| :----------------------------------------- | :------------------------------------------------ | :-------------------------------- |
| Typecheck JS completo                      | `./node_modules/.bin/tsc --noEmit`                | Verde (0 errores en 190 archivos) |
| Pruebas unitarias/integración              | `bun test`                                        | Verde (472 pasados, 0 fallos)     |
| Linting completo (html, js, md, json, css) | `eslint`, `htmlhint`, `markdownlint`, `stylelint` | Verde (0 errores, 0 warnings)     |
| Formato de código                          | `./node_modules/.bin/prettier --check .`          | Verde (100% formateado)           |
| Build pipeline                             | `bun scripts/build/build.js`                      | Verde (6 templates compilados)    |
| Validador HTML email                       | `bun scripts/validators/validate-email-html.js`   | Verde (0 errores)                 |
| Comprobación de rama                       | `bun scripts/ai/check-task-branch.mjs`            | Verde (`feature/mhb-13`)          |

## Últimas entregas

- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                               |
| :----- | :--------- | :------------------------------------- | :---------------------------------------------------- |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y aceptada en `feature/mhb-13`. |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.    |

## Decisiones y desviaciones vigentes

- **Sin `@ts-ignore`:** Todos los diagnósticos se solventaron con anotaciones JSDoc y type guards nativos.
- **Sin `.ts` prematuro:** Todos los archivos permanecen `.js`/`.mjs`; conversión reservada para MHB-29–MHB-34.
- **Sin `strict` global prematuro:** Se amplió `checkJs: true` preservando flags permisivos de migración.
- **Declaraciones ambientales acotadas:** `types/*.d.ts` definen interfaces externas (DOM/lucide/import.meta) sin tocar runtime.

## Handoff

- Próxima acción inmediata: merge de `feature/mhb-13` a `master`.
- Siguiente tarea del roadmap:
  - MHB-29 (`desbloqueado`): Base de ejecución TypeScript (prerequisito MHB-13 completado).
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad (depende de flujo de producto publicado).
  - MHB-28 (`desbloqueado`): Modularización de superficies web sobredimensionadas.
