# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-20
- Estado: En revisión
- Implementador: Perfil pruebas/integración
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-20`
- Última actualización: 2026-09-18
- Contrato activo: `docs/implementation/PLAN.md`

## Controles de MHB-20

| Control                     | Estado | Detalle                                                                 |
| --------------------------- | ------ | ----------------------------------------------------------------------- |
| Suite de integración MHB-20 | Verde  | 5 tests, 73 expect en `scripts/build/build-render-cache-export.test.js` |
| Cobertura de caché          | Verde  | 13 tests, 28 expect en `scripts/vite/services/preview-cache.test.js`    |
| Suite global                | Verde  | 512 pass, 0 fail en 64 archivos                                         |
| Typecheck                   | Verde  | `tsc --noEmit` sin errores                                              |
| Lint JS & MD                | Verde  | ESLint y Markdownlint limpios                                           |
| Formato                     | Verde  | Prettier check limpio                                                   |
| Branch check                | Verde  | `node scripts/ai/check-task-branch.mjs` verificado en `feature/mhb-20`  |
| Aislamiento de temporales   | Verde  | `dist/` y `.cache/` de la raíz sin mutación                             |

## Hechos de la entrega

1. Se implementó la suite de integración `scripts/build/build-render-cache-export.test.js` cubriendo escenarios transaccional (`receipt`) y marketing (`newsletter`).
2. Se comprobaron los flujos de build con flatten (`dist/<template>.html`), delimitadores (`[[ ]]` evaluados y `{{ }}` ESP preservados), gates (< 102 KB y compatibilidad), render de preview, temas light/dark, caché (`theme+dataHash`) y exportación HTML.
3. Se añadió cobertura unitaria dedicada para `PreviewCacheManager` en `scripts/vite/services/preview-cache.test.js`.
4. Se añadieron overrides opcionales de directorio a `checkHtmlSize` y `validateEmailHtml` para permitir pruebas herméticas sobre fixtures temporales.
5. Se validó manualmente el output de `dist/receipt.html` y `dist/newsletter.html`, confirmando ausencia de dependencias de binarios PNG.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0)
  es el baseline funcional publicado.
- `readBuiltTemplate` resuelve nombres contra `dist/` sin reutilizar el guard
  de rutas central. No consolidar ese comportamiento con pruebas; requiere un
  ID propio si se decide corregirlo.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]`
  queda reservado para Maizzle.

## Handoff

- Próxima acción inmediata: revisión técnica independiente y confirmación de cierre para MHB-20.
- Siguiente tarea del roadmap: MHB-13 (`bloqueado` hasta la confirmación de cierre de MHB-20).
