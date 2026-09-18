# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: Ninguno
- Estado: `v1.2.0` publicada; puerta de calidad pendiente
- Última actualización: 2026-09-18
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0)
  es el baseline funcional publicado.
- `readBuiltTemplate` resuelve nombres contra `dist/` sin reutilizar el guard
  de rutas central. No consolidar ese comportamiento con pruebas; requiere un
  ID propio si se decide corregirlo.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]`
  queda reservado para Maizzle.

## Handoff

- Próxima acción inmediata: asignar MHB-20 o mantener el roadmap sin ID activo.
- Siguiente tarea: MHB-20 (`desbloqueado`). Sus prerequisitos funcionales
  —render, templates de producto, preview y exportación HTML— ya están
  disponibles en `v1.2.0`; no requiere reabrir tareas anteriores.
