# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: ninguno
- Estado: Sin tarea en curso
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Decisiones y desviaciones vigentes

- **Modularización de transformaciones de preview (`services/transforms/`):** Desacoplamiento de `component-preview-transforms.js` en módulos especializados (`delimiter-transforms.ts`, `conditional-transforms.ts`, `table-transforms.ts`, `script-transforms.ts`, `index.ts`) para respetar ≤ 250 líneas por archivo.
- **Reestructuración de carpetas temáticas en `services/`:** División de los 15 archivos planos de `scripts/vite/services/` en subdirectorios temáticos (`cache/`, `catalog/`, `transforms/`, `render/`) respetando ≤ 8 archivos fuente por carpeta y exponiendo un barril unificado `services/index.ts`.
- **Preservación total de contratos de desarrollo:** URLs `/api/*`, payloads de render/componentes, caché en `.cache/preview/` y resolución de rutas limpias se mantienen 100% idénticos.

## Handoff

- Próxima acción: asignar el siguiente ID del roadmap.
- Siguiente tarea del roadmap:
  - MHB-37 (`desbloqueado`): Contratos compartidos, constantes tipadas y guards de tipos.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-34 (`bloqueado`): Cierre total y modo estricto TypeScript; depende de MHB-37.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4 (email y dashboard); no antes de 2027-01-15 salvo disparador, límite 2027-06-30; hasta entonces se mantiene Maizzle 5 + Tailwind v3.
