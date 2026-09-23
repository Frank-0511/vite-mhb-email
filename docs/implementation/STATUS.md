# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-39
- Estado: En progreso
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-39`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md` (MHB-39)
- Nota de inicio: Iniciada la ejecución de MHB-39 para estandarizar convenciones de nombres de archivo y carpetas, test estructural de árbol, plugin de ESLint y linting estricto con tipos.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-39: Convenciones de nombres de archivo y linting con tipos)

- **Hechos de implementación:**
  1. Preparada la rama `feature/mhb-39` y añadido el contrato formal de MHB-39 a `docs/implementation/PLAN.md`.
  2. Iniciando renombres por grupos con `git mv` y actualización sistemática de imports.
- **Riesgo residual:** Ninguno identificado en inicio de tarea.

### Controles de Calidad

| Control                  | Comando                                | Resultado |
| :----------------------- | :------------------------------------- | :-------- |
| Comprobación de rama     | `bun scripts/ai/check-task-branch.mjs` | Pendiente |
| Typecheck unificado      | `tsc --noEmit` (`bun run typecheck`)   | Pendiente |
| Suite global de pruebas  | `bun run test`                         | Pendiente |
| Linting completo         | `bun run lint`                         | Pendiente |
| Formato de código        | `bun run format:check`                 | Pendiente |
| Build y validación email | `bun run build`                        | Pendiente |

## Decisiones y desviaciones vigentes

- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file` para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con helper en `scripts/vite/api/http.ts` para captura determinista de excepciones.

## Handoff

- Próxima acción inmediata: Ejecución de renombres por grupo (B1) con `git mv` y typecheck en verde por commit.
- Siguiente tarea del roadmap:
  - MHB-34 (`bloqueada` tras MHB-39): Cierre total y modo estricto TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4.
