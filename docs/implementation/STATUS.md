# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-31
- Estado: Completada
- Implementador: Perfil TypeScript/CLI
- Revisor: Frank-0511 (Aprobación técnica usuario)
- Rama: `feature/mhb-31`
- Última actualización: 2026-09-22
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-30 completada y mergeada a `master` (commits `14af516` a `f6301ea`).
- MHB-35 completada y mergeada a `master` (commit `b495ec5`).
- MHB-28 completada en `feature/mhb-28`.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-31: CLI, exportación y correo en TypeScript)

- **Migración a TypeScript estricto:** Conversión a `.ts` de `scripts/generators/**`, `scripts/export/**`, `scripts/mail/**` y `scripts/cli/**` (0 JS restantes en Capa 2).
- **Refactor integrado de `scripts/cli/helpers.js`:** Desacoplamiento modular en `process-runner.ts`, `prompts.ts`, `template-prompts.ts` y barril `helpers.ts` manteniendo responsabilidad única y ≤ 250 líneas.
- **Tipado ambiental seguro:** Declaración de `types/nodemailer.d.ts` sin añadir dependencias runtime ni alterar contratos.
- **Suite de pruebas de correo:** Creación de `scripts/mail/mail.test.ts` con validación de entorno y payloads sin envíos reales ni credenciales.
- **Preservación total de contratos:** Comandos, argumentos, códigos de salida y comportamiento interactivo idénticos al baseline.

### Controles de Calidad

| Control                                       | Comando                                | Resultado |
| :-------------------------------------------- | :------------------------------------- | :-------- |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde     |
| Typecheck unificado + estricto                | `bun run typecheck`                    | Verde     |
| Pruebas unitarias/integración (537 tests)     | `bun test`                             | Verde     |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | Verde     |
| Formato de código                             | `bun run format:check`                 | Verde     |
| Build pipeline                                | `bun run build`                        | Verde     |
| Validador HTML email                          | `bun run validate-email`               | Verde     |
| Control de inventario TypeScript              | `bun run check:inventory`              | Verde     |
| Sincronización de agentes                     | `bun run agents:check`                 | Verde     |

## Últimas entregas

- MHB-31: `Completada` el 2026-09-22; CLI, exportación y correo migrados a TypeScript estricto (0 errores tsc, 537 tests verdes, helpers modularizados, layer-2-cli en 0 JS / 24 TS); rama `feature/mhb-31`.
- MHB-30: `Completada` el 2026-09-22; núcleo, build, ESP, validadores, benchmarks e inventario migrados a TypeScript estricto (0 errores tsc, 529 tests verdes, hashes `dist/*.html` idénticos byte a byte, layer-1-core en 0 JS / 74 TS); rama `feature/mhb-30`.
- MHB-35: `Completada` el 2026-09-22; consolidación de utilidades shared (`format-helpers`, `theme-helpers`), adopción estricta de storage keys, eliminación de fetch crudo y saneamiento de render inicial de skeletons sin FOUC en preview; rama `feature/mhb-35`.
- MHB-28: `Completada` el 2026-09-21; modularización de superficies web sobredimensionadas (< 300 líneas en `src/web/**`, arquitectura `preview/modules/` por dominios, Web Component `<ef-skeleton>` en Light DOM, extracción de JS inline, cero regresión en `dist/*.html`); rama `feature/mhb-28`.
- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                                                    |
| :----- | :--------- | :------------------------------------- | :------------------------------------------------------------------------- |
| MHB-31 | Completada | CLI, exportación y correo en TS        | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-31`. |
| MHB-30 | Completada | Núcleo y validadores en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-30`. |
| MHB-35 | Completada | Consolidación shared y deduplicación   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-35`. |
| MHB-28 | Completada | Modularización web sobredimensionada   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-28`. |
| MHB-29 | Completada | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).                         |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).                      |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.                         |

## Decisiones y desviaciones vigentes

- **Desacoplamiento modular de `scripts/cli/helpers.js`:** Dividido en `process-runner.ts`, `prompts.ts`, `template-prompts.ts` y un barril cohesivo `helpers.ts` para respetar el umbral de ≤ 250 líneas y responsabilidad única.
- **Tipado ambiental de Nodemailer:** Incorporación de `types/nodemailer.d.ts` para cubrir `createTransport` y la interfaz del transporter sin requerir paquetes de tipos adicionales en devDependencies.
- **Pruebas unitarias de mail con mocks seguros:** Adición de `scripts/mail/mail.test.ts` con cobertura de validaciones de credenciales y API REST de Mailtrap inyectando mocks de red sin envíos reales.
- **Sincronización de baseline de inventario para MHB-35:** Incorporación de 5 archivos JS/MJS legítimos, elevando el baseline a 206 archivos JS para control estricto decreciente hacia MHB-30 y MHB-33.
- **Política de refactor integrado y límites cuantitativos:** Se acuerda no crear más tareas de refactor aisladas; todo trabajo debe refactorizar mientras avanza respetando límites estrictos (≤250 líneas archivo fuente, ≤8 archivos por carpeta).

## Handoff

- Entrega de MHB-31: En revisión en rama `feature/mhb-31`.
  - Commits en rama:
    - `e321b08`: `docs(status): registrar inicio de MHB-31 en progreso`
    - `0325d1b`: `feat(generators): migrar generadores y arquetipos a typescript estricto (MHB-31)`
    - `f024055`: `feat(export): migrar exportador y renderizador puppeteer a typescript estricto (MHB-31)`
    - `d7fc22a`: `feat(mail): migrar transporte smtp, api mailtrap y selectores a typescript estricto (MHB-31)`
    - `0bbb4d9`: `feat(cli): modularizar helpers y migrar loop interactivo a typescript estricto (MHB-31)`
  - Evidencia de calidad:
    - `bun run check:task-branch`: Verde (`feature/mhb-31`).
    - `bun run typecheck`: 0 errores en base y `tsconfig.strict.json`.
    - `bun test`: 537 pasados en 74 suites, 0 fallos.
    - `bun run lint`: 0 errores en HTML, JS/TS, MD, JSON y CSS.
    - `bun run format:check`: Código 100% formateado según Prettier.
    - `bun run build`: 6 templates generados en 3.31s con tamaño seguro para Gmail.
    - `bun run validate-email`: 0 errores de compatibilidad.
    - `bun run check:inventory`: Capa `layer-2-cli` en 0 JS / 24 TS (`✅ Migrado`), total proyecto 115 JS / 106 TS.
    - `bun run agents:check`: 7 adaptadores declarados válidos.
    - Verificación manual CLI: `bun run cli --help` y `bun run generate:email --list` conformes con exit code 0; casos de escape/inválidos rechazados con exit code 1.
  - Riesgos residuales:
    - Ninguno. Contratos de comandos, flags, prompts y rutas de filesystem preservados.
  - Próxima acción inmediata: Revisión técnica independiente y confirmación de cierre de MHB-31 para merge a `master`.
- Siguiente tarea del roadmap:
  - MHB-32 (`desbloqueado`): Servidor Vite y APIs en TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
