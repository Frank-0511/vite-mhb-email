# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-39
- Estado: En revisión
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-39`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md` (MHB-39)
- Nota de cierre de implementación: Finalizada la implementación de MHB-39. Se estandarizaron convenciones de nombres mediante 20 renombres con `git mv`, se integró `eslint-plugin-check-file` fijado, se implementó el test estructural de árbol, se activó linting estricto con tipos sobre `tsconfig.strict.json` resolviendo promesas y redundancias, y se documentaron las convenciones en la nueva skill `email-code-conventions`.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-39: Convenciones de nombres de archivo y linting con tipos)

- **Hechos de implementación:**
  1. Renombrados 20 archivos mediante `git mv` en 6 grupos cohesivos con commits atómicos verdes (plugins Vite, entrypoints `main.ts`, módulos `esp/`, scripts de `build/`, fixtures `*.fixtures.ts`, validadores y submódulos `copy-html/`).
  2. Instalado y fijado `eslint-plugin-check-file@3.3.2` en `package.json` con reglas de kebab-case y blocklist de helpers/utils genéricos.
  3. Creado `scripts/validators/lint-guards/file-tree.test.ts` (185 líneas) validando límites de 250 líneas en producción, 400 líneas en tests, máximo 8 archivos por carpeta y sufijos de rol.
  4. Activado linting con tipos en `eslint.config.js` (`project: ["./tsconfig.strict.json"]`) con reglas `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-redundant-type-constituents`, `require-await`, `return-await`. Eliminado selector AST casero `UNION_WITH_STRING_SELECTOR`.
  5. Creado `asyncHandler` en `scripts/vite/api/http.ts` envolviendo los 6 endpoints Vite. Resueltas todas las promesas flotantes, tipado de mocks (`Mock<...>`) y `void` documentados en frontend y scripts.
  6. Creada skill `docs/ai/skills/email-code-conventions/` (36 líneas), actualizadas skills relacionadas y `docs/ai/AGENTS.md`, y sincronizados adaptadores con `agents:sync` y `agents:check`.
- **Riesgos residuales:**
  1. 18 archivos preexistentes conservan prefijo del directorio padre documentados con `TODO(mhb-40)` en `file-tree.test.ts` para su saneamiento en MHB-40 sin ampliar el alcance de MHB-39.
  2. Incremento medido en `lint:js` de +1.95s (de 1.81s a 3.76s) debido al análisis semántico de `parserOptions.project`, balanceado por la erradicación completa de promesas flotantes y tipos redundantes.

### Controles de Calidad

| Control                  | Comando                                | Resultado                          |
| :----------------------- | :------------------------------------- | :--------------------------------- |
| Comprobación de rama     | `bun scripts/ai/check-task-branch.mjs` | Pasó (feature/mhb-39)              |
| Typecheck unificado      | `tsc --noEmit` (`bun run typecheck`)   | Pasó (0 errores en ambos tsconfig) |
| Suite global de pruebas  | `bun run test`                         | Pasó (590 tests, 77 suites)        |
| Linting completo         | `bun run lint`                         | Pasó (HTML, JS, MD, JSON, CSS)     |
| Formato de código        | `bun run format:check`                 | Pasó (100% Prettier)               |
| Build y validación email | `bun run build`                        | Pasó (6 templates, 0 errores)      |
| Validación email         | `bun run validate-email`               | Pasó (0 errores)                   |
| Adaptadores de agentes   | `bun run agents:check`                 | Pasó (7 targets declarados)        |
| Diff de Git              | `git diff --check`                     | Pasó (limpio)                      |

## Decisiones y desviaciones vigentes

- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-39 para confirmar cierre.
- Siguiente tarea del roadmap:
  - MHB-34 (`desbloqueada` tras MHB-39): Cierre total y modo estricto TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4.
