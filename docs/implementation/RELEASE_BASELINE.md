# Línea base de release

## Propósito

Este documento conserva la trazabilidad entre el snapshot inmutable `v1.1.0` y
el cierre de producto `v1.2.0` de la Fase B. No autoriza publicar, mover tags,
editar releases remotas ni incrementar versiones posteriores.

## Referencias verificadas localmente

| Referencia            | SHA                                        | Fecha      | Rol                                     |
| --------------------- | ------------------------------------------ | ---------- | --------------------------------------- |
| Tag anotado `v1.1.0`  | `0d52a094a7332093396d53ec6696bffd58f2d15c` | 2026-08-10 | Snapshot publicado que no se reescribe  |
| Línea base documental | `ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c` | 2026-08-10 | Punto de partida definido por `PLAN.md` |
| HEAD al reconciliar   | `c192ce31dc5b6f487821951b61e999d7b0f62a7f` | 2026-08-13 | Estado de trabajo, no una release       |

`v1.1.0` es ancestro de `ce708cf` y de `v1.2.0`. El tag `v1.2.0` agrupa los
cambios de las tareas MHB-05 a MHB-12, MHB-17, MHB-18, MHB-21, MHB-24 y MHB-25.
El tag anotado `v1.2.0` apunta al commit de release que contiene este documento.

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

- El bloque `1.1.0` del CHANGELOG describe solo el contenido verificable del
  tag; el bloque `1.2.0` documenta el cierre de Fase B.
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
