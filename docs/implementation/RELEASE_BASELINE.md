# Línea base de release

## Propósito

Este documento conserva la trazabilidad entre los snapshots inmutables `v1.1.0`,
`v1.2.0`, la release funcional `v1.3.0` y la release `v1.4.0`. No autoriza publicar, mover tags,
editar releases remotas ni incrementar versiones posteriores sin aprobación
explícita.

## Referencias verificadas localmente

| Referencia            | SHA                                                           | Fecha      | Rol                                        |
| --------------------- | ------------------------------------------------------------- | ---------- | ------------------------------------------ |
| Tag anotado `v1.1.0`  | `0d52a094a7332093396d53ec6696bffd58f2d15c`                    | 2026-08-10 | Snapshot publicado que no se reescribe     |
| Línea base documental | `ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c`                    | 2026-08-10 | Punto de partida definido por `PLAN.md`    |
| Tag anotado `v1.2.0`  | `c19de2cd795d857481b8cb98979de79700ede0a6`                    | 2026-09-18 | Baseline funcional publicado de Fase B     |
| HEAD al reconciliar   | `c192ce31dc5b6f487821951b61e999d7b0f62a7f`                    | 2026-08-13 | Estado intermedio reconciliado             |
| Tag anotado `v1.4.0`  | `def38fb1e076b55a0ab3774d58833d90f16eb3d9` (commit `d9671ee`) | 2026-11-23 | Release de MHB-49 (Fase D), sobre `master` |

`v1.1.0` es ancestro de `v1.2.0`, `v1.2.0` de `v1.3.0` y `v1.3.0` de `v1.4.0`. La
release `v1.3.0` agrupa el trabajo acumulado de las tareas MHB-13, MHB-14,
MHB-28, MHB-29, MHB-30 a MHB-37, MHB-39 a MHB-47 y MHB-36 (Fase C).

## Matriz de reconciliación

| Hecho                                                              | Clasificación                             | Fuente local                                                             |
| ------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------ |
| Versión `1.1.0` y Bun `1.3.13`                                     | Incluido en `v1.1.0`                      | `git show v1.1.0:package.json`                                           |
| `bun.lock`                                                         | Incluido en `v1.1.0`; actualizado después | `git ls-tree -r v1.1.0 -- bun.lock`, `git diff v1.1.0..HEAD -- bun.lock` |
| CI por rutas con Bun `1.3.13`                                      | Incluido en `v1.1.0`                      | `git show v1.1.0:.github/workflows/ci.yml`                               |
| `dist/example.html`, `dist/user-created.html`, `dist/welcome.html` | Incluidos en `v1.1.0`                     | `git ls-tree -r v1.1.0 -- dist`                                          |
| Tres capturas enlazadas desde README                               | Incluidas en `v1.1.0`                     | `git ls-tree -r v1.1.0 -- screenshots`                                   |
| Guard de nombres, exportación PNG portable y procesos sin shell    | Posteriores a `v1.1.0`                    | `git log v1.1.0..HEAD -- scripts/`                                       |
| Instrucciones de agentes y estado de implementación actuales       | Posteriores a `v1.1.0`                    | `git diff --name-status v1.1.0..HEAD -- docs/`                           |

## Política de corrección

- Cada bloque del CHANGELOG describe solo el contenido verificable de su tag.
- Todo cambio posterior se documenta bajo `Unreleased` y requiere una nueva
  decisión de versión, tag y release coherentes.
- La presencia o contenido de una release remota debe verificarse antes de
  cualquier versión posterior.

## Reproducción

```bash
git show --no-patch v1.1.0
git merge-base --is-ancestor v1.1.0 ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c
git merge-base --is-ancestor v1.1.0 v1.2.0
git diff --name-status v1.1.0..HEAD
git ls-tree -r --name-only v1.1.0 -- .github/workflows bun.lock dist screenshots
```
