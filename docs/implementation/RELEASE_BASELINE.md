# Línea base de release

## Propósito

Este documento separa el contenido inmutable de `v1.1.0` del trabajo posterior
en el repositorio. No autoriza publicar, mover tags, editar releases remotas ni
incrementar versiones.

## Referencias verificadas localmente

| Referencia            | SHA                                        | Fecha      | Rol                                     |
| --------------------- | ------------------------------------------ | ---------- | --------------------------------------- |
| Tag anotado `v1.1.0`  | `0d52a094a7332093396d53ec6696bffd58f2d15c` | 2026-08-10 | Snapshot publicado que no se reescribe  |
| Línea base documental | `ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c` | 2026-08-10 | Punto de partida definido por `PLAN.md` |
| HEAD al reconciliar   | `c192ce31dc5b6f487821951b61e999d7b0f62a7f` | 2026-08-13 | Estado de trabajo, no una release       |

`v1.1.0` es ancestro de `ce708cf`. Los cambios entre esas referencias y los
posteriores a la línea base permanecen sin publicar hasta que el orquestador
decida una versión, tag y release coherentes.

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
  tag. Todo cambio posterior se documenta bajo `Unreleased`.
- La documentación actual puede describir requisitos vigentes, pero debe
  identificar a HEAD como trabajo no publicado cuando haga una afirmación de
  release.
- La presencia o contenido de una release remota no se verificó localmente.
  Su revisión es una acción manual del orquestador antes de crear una
  corrección `v1.1.1` o cualquier release posterior.

## Reproducción

```bash
git show --no-patch v1.1.0
git merge-base --is-ancestor v1.1.0 ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c
git diff --name-status v1.1.0..HEAD
git ls-tree -r --name-only v1.1.0 -- .github/workflows bun.lock dist screenshots
```
