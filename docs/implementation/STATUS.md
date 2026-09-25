# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-44
- Descripción: Compatibilidad del HTML exportado con clientes reales
- Estado: En progreso
- Implementador: perfil email/compatibilidad (sesión actual)
- Revisor: pendiente de asignación
- Rama: `feature/mhb-44`
- Última actualización: 2026-09-25
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa

- MHB-44 `En progreso` — Paso 1 completado (reglas de `validate-email`) más la ampliación de alcance de 8 KB resuelta en el mismo paso:
  - 6 reglas nuevas ERROR/WARNING: `css-color-format`, `css-relative-units`, `img-svg-source`, `img-host-allowlist`, `example-domains`, `style-block-size` (registradas en `rules/registry.ts`, con test co-locado cada una).
  - Causa raíz del límite de 8 KB corregida: `maizzle.config.js` tenía `css.inline.removeInlinedSelectors: false` (mantenía en `<style>` selectores ya inlineados, duplicando CSS). Se restauró a `true` (default de Maizzle); `dist/*.html` regenerado, los 6 templates bajan de 8192 bytes por bloque `<style>` (antes 4/6 lo superaban, hasta 10 741 bytes) y las `@media`/dark mode se preservan intactas.
  - `bun run validate-email` sobre el `dist/` actual: 44 ERROR (`css-color-format`, `css-relative-units`, `img-svg-source`, `img-host-allowlist`) + 6 WARNING (`example-domains`/`link-targets`), 0 en `style-block-size` (ya corregido). Falla a propósito hasta el paso 2 (preset de color/unidades) y el paso 4 (iconos PNG).
  - Variables ESP `{{ }}` verificadas idénticas antes/después por template (`git show HEAD:dist/<t>.html` vs `dist/<t>.html`, comparando ocurrencias `{{ }}`).
  - Controles verdes: `bun run lint`, `bun run typecheck`, `bun run format:check`, `bun run test` (661/663; los 2 fallos son los CLI de `validate-email`/`check:dist-baseline` fallando a propósito sobre el `dist/` aún no corregido).
- Plan operativo temporal en `docs/superpowers/plans/2026-09-25-mhb-44-compatibilidad-clientes.md` (se elimina antes de la PR).
- D1 (preset `tailwindcss-preset-email`) aprobada; D2 (hosting PNG) y D3 (fuente `mdi:hand-wave`) pendientes, bloquean solo el paso de iconos (paso 4). Próximo paso propio: paso 2 (aplicar el preset para que los colores salgan en HEX y las unidades en `px`).

## Últimas entregas

- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad             | Handoff                                                  |
| :----- | :--------- | :-------------------- | :------------------------------------------------------- |
| MHB-45 | Completada | CI y seguridad        | Revisión técnica independiente aprobada (`task-review`). |
| MHB-41 | Completada | Tooling y CI          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **MHB-44 — Ampliación de alcance acordada (2026-09-25):** el contrato original de MHB-44 cubre colores CSS Color 4, `rem`/`em` inline, SVG remotos y enlaces de ejemplo. El usuario pidió sumar el límite de 8 KB por bloque `<style>` (Gmail descarta el bloque completo si lo supera, perdiendo también las media queries que sí sobreviven al inlining). Tratamiento: nueva regla `style-block-size` (ERROR) en `validate-email`, más purga/reducción de selectores redundantes en el `<style>` de salida para bajar de 8 192 bytes por bloque.
- **Protección de `master` (aprobada 2026-09-25, MHB-45):** checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, rama actualizada (`strict`), PR obligatorio con 0 aprobaciones (mantenedor único), `enforce_admins`, historial lineal, sin force-push ni borrado. Verificada vigente en `master` por el revisor independiente.
- **Auto-merge de Dependabot (aprobado 2026-09-25, MHB-45):** fusión con `--rebase`; se elimina el paso de aprobación automática; las actualizaciones minor/patch de `github-actions` pueden fusionarse solas con checks verdes; dependencias del pipeline de email siempre en revisión manual.
- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: continuar MHB-44 con el paso 2 (preset `tailwindcss-preset-email`, D1 ya aprobada) y luego pedir al usuario D2 (hosting de PNG) y D3 (fuente de `mdi:hand-wave`) antes del paso 4 de iconos.
- Siguiente tarea del roadmap:
  - MHB-44 sigue `En progreso` (este ID); no hay otro ID bloqueado por asignar mientras continúa.
