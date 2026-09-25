# MHB-45 — Plan de ejecución: protección de `master` y política de Dependabot

Artefacto temporal de la tarea. El contrato vinculante está en
`docs/implementation/PLAN.md` (sección MHB-45). Se elimina junto con el resto de
`docs/superpowers/` antes de preparar la PR (salvo el anexo de MHB-38, que
pertenece a su propio ID).

Datos relevados el 2026-09-25 sobre `master` @ `6936828`.

## 1. Estado de partida (revalidado)

| Hecho                               | Evidencia                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `master` sin protección             | `gh api …/branches/master/protection` → 404 `Branch not protected`                                                                                                 |
| Sin rulesets                        | `gh api …/rulesets` → `0`                                                                                                                                          |
| Auto-merge habilitado en el repo    | `allow_auto_merge: true`; permite merge, squash y rebase                                                                                                           |
| Auto-merge sin checks = inmediato   | Sin checks requeridos, `gh pr merge --auto` fusiona al instante: #34 (`maizzle`), #36, #37 y #38 se fusionaron el 2026-09-23 en ~1 min                             |
| Workflow de auto-merge sin filtro   | `dependabot-automerge.yml` aprueba y fusiona todo lo que no sea `semver-major`, con `--merge` (commit de merge)                                                    |
| Historial de `master` lineal        | Los PR #40–#44 se integraron por rebase; `--merge` de Dependabot rompe esa linealidad                                                                              |
| `dependabot.yml` incompleto         | Solo ecosistema `bun`; no cubre `github-actions` (`checkout@v5`, `setup-bun@v2`, `cache@v5`, `fetch-metadata@v2`)                                                  |
| Checks estables publicados (MHB-41) | `CI Pipeline` (agregado de `Format & Lint`, `Typecheck`, `Test`, `Build & Validate`), `Accessibility & Contrast Audit`; CodeQL default setup publica `Analyze (…)` |
| Flujo actual 100 % vía PR           | Incluso el commit de cierre `6936828` entró por el PR #44; la protección no rompe el flujo de trabajo vigente                                                      |

## 2. Decisiones aprobadas (usuario, 2026-09-25)

Registradas en `STATUS.md` (D1, D2 y decisiones de protección y auto-merge).
No reabrirlas; cualquier cambio se confirma de nuevo con el usuario.

| #   | Decisión                       | Acuerdo                                                                                                                                                                               |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Checks requeridos              | `CI Pipeline` y `Accessibility & Contrast Audit`. No exigir los jobs internos (el agregado los cubre) ni `Analyze (…)` de CodeQL (default setup, fuera del repo).                     |
| P2  | Aprobaciones requeridas        | 0. Mantenedor único: GitHub no permite aprobar el PR propio. Se exige PR, no review.                                                                                                  |
| P3  | `enforce_admins`               | `true`. El flujo ya es 100 % vía PR; el admin puede desactivarlo puntualmente ante una emergencia.                                                                                    |
| P4  | Historial lineal               | `required_linear_history: true` y auto-merge de Dependabot con `--rebase` en vez de `--merge`.                                                                                        |
| P5  | Paso `gh pr review --approve`  | Eliminarlo. Los permisos del workflow no cambian (exclusión del contrato).                                                                                                            |
| P6  | Auto-merge de `github-actions` | Permitido para minor/patch con checks verdes. Major siempre manual.                                                                                                                   |
| P7  | Entrada en `CHANGELOG.md`      | **D1** aprobada: entrada bajo `[Unreleased]`.                                                                                                                                         |
| P8  | Validación manual del bloqueo  | **D2** aprobada: push de una rama desechable con un check en rojo y PR borrador contra `master`; cerrar el PR y borrar la rama remota tras la evidencia (procedimiento en el paso 5). |
| P9  | Aplicación de la protección    | La aplica el implementador vía `gh api -X PUT` con el payload del paso 1 tal cual. Si el payload cambia, reconfirmar con el usuario antes de ejecutar.                                |

## 3. Avance y punto de reanudación

Hecho en `feature/mhb-45` (local, **sin push**):

- `f295888` — `STATUS.md` con MHB-45 `En progreso`, D1/D2 y decisiones;
  `PLAN.md` con MHB-40/41 `Completada` y MHB-45 `En progreso`; detalle de
  MHB-41 archivado en `STATUS-HISTORY.md`.
- Este plan, versionado en la rama como artefacto temporal.

Para reanudar en otro entorno:

```bash
git fetch origin
git switch feature/mhb-45   # si no existe local: git switch -c feature/mhb-45 --track origin/feature/mhb-45
git status --short
bun install --frozen-lockfile
bun run check:task-branch
```

Si la rama no está en `origin`, pedir al usuario que haga push desde el entorno
donde se creó. Continuar en el paso 1 de la sección 4.

## 4. Pasos técnicos

Orden deliberado: la protección va **primero**, porque mientras no existan
checks requeridos cualquier `--auto` fusiona al instante, incluso con el
workflow ya filtrado.

### Paso 1 — Protección de `master` (acción en GitHub, aprobada en P9)

Payload aprobado (guardarlo en `docs/superpowers/mhb-45/protection.json`, temporal):

```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [{ "context": "CI Pipeline" }, { "context": "Accessibility & Contrast Audit" }]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
```

```bash
gh api -X PUT repos/Frank-0511/vite-mhb-email/branches/master/protection --input docs/superpowers/mhb-45/protection.json
```

Verificar de inmediato con el primer comando de la sección 5. Tras aplicarla,
el PR de `feature/mhb-45` también necesitará ambos checks en verde para fusionarse.

Riesgo conocido: `strict: true` obliga a rebasar cada PR tras otro merge;
Dependabot lo hace solo, pero varios PR simultáneos se fusionarán en serie.

### Paso 2 — Restringir el auto-merge (`dependabot-automerge.yml`)

- Lista de exclusión en **un único lugar**: variable `env.MANUAL_REVIEW_DEPS`
  del job con los patrones `@maizzle/* maizzle tailwindcss postcss autoprefixer juice handlebars`.
- Paso nuevo `Clasificar actualización` que recorre
  `steps.metadata.outputs.dependency-names` (lista separada por comas; en PR
  agrupados trae varias) y emite `manual=true` si **cualquiera** coincide con un
  patrón (`case` de bash, sin dependencias nuevas).
- Bloque de referencia (el mismo que se simula en la sección 5):

  ```bash
  manual=false
  IFS=',' read -ra deps <<< "$DEPENDENCY_NAMES"
  for dep in "${deps[@]}"; do
    dep="${dep// /}"
    for pattern in $MANUAL_REVIEW_DEPS; do
      case "$dep" in $pattern) manual=true ;; esac
    done
  done
  echo "manual=$manual" >> "$GITHUB_OUTPUT"
  ```

  `DEPENDENCY_NAMES` llega por `env` desde `steps.metadata.outputs.dependency-names`
  (nunca interpolado con `${{ }}` dentro de `run`, para evitar inyección). El
  patrón va sin comillas en el `case` a propósito, para que `@maizzle/*` actúe
  como glob; si `set -f` o un linter lo impiden, sustituir por comparación
  explícita y registrar la decisión.

- `gh pr merge --auto --rebase` solo si `update-type != semver-major` y
  `manual != true`. Si es manual, añadir un comentario/etiqueta informativa es
  opcional; se prefiere no hacerlo (menos es más) salvo que el usuario lo pida.
- El bloqueo por checks rojos lo garantiza el paso 1: `--auto` espera a los
  checks requeridos y nunca fusiona en rojo.
- Mantener `permissions` actuales (`contents: write`, `pull-requests: write`) y
  `on: pull_request`.

### Paso 3 — `dependabot.yml`

- Ecosistema `github-actions` (`directory: "/"`, semanal).
- En `bun`: grupo `dev-dependencies` (`dependency-type: development`,
  `update-types: [minor, patch]`) con `exclude-patterns` = misma lista crítica,
  para que las dependencias del pipeline de email lleguen siempre en PR
  individual y visible.
- En `github-actions`: grupo `actions` para minor/patch.
- Eliminar el comentario de plantilla genérico.
- Verificar al iniciar que el ecosistema `bun` admite `groups` (docs de
  Dependabot); si no, escalar antes de agrupar.

### Paso 4 — Prueba de bloqueo con check rojo (D2, acción externa aprobada)

El hook pre-commit exige estar en `feature/mhb-45` (`check:task-branch` compara
el nombre exacto), así que el commit rojo se crea ahí, se publica en otra rama
remota y se descarta localmente. Se altera `dist/` (fuera de `lint-staged`) para
que falle `Build & Validate` → `CI Pipeline`, como en MHB-41.

```bash
git switch feature/mhb-45 && git status --short   # debe estar limpio
echo "<!-- mhb-45 prueba de bloqueo -->" >> dist/welcome.html
git commit -am "test(ci): prueba de bloqueo por check rojo (MHB-45, desechable)"
git push origin HEAD:refs/heads/test/mhb-45-red-check
git reset --hard HEAD~1                            # solo este commit local, no publicado en feature/mhb-45
gh pr create --base master --head test/mhb-45-red-check --title "[NO FUSIONAR] MHB-45 prueba de bloqueo" --body "PR desechable de MHB-45 (D2)."
gh pr checks <n> --watch                           # esperar el rojo de CI Pipeline
gh pr view <n> --json mergeStateStatus,statusCheckRollup --jq '.mergeStateStatus'   # esperado: BLOCKED
gh pr close <n> --delete-branch
```

- PR normal, no borrador: un borrador reporta `DRAFT` en vez de `BLOCKED`.
- No intentar `gh pr merge` como prueba: si la protección estuviera mal
  configurada, fusionaría el cambio roto.
- Evidencia: número/URL del PR, URL de la ejecución roja y salida `BLOCKED`.

### Paso 5 — Cierre documental

- `CHANGELOG.md` `[Unreleased]` (D1): protección de `master`, exclusiones de
  auto-merge, ecosistema `github-actions` y agrupación.
- `STATUS.md`: hechos, controles, evidencia y paso a `En revisión`.

## 5. Criterios de aceptación → comando que falla si no se cumple

| Criterio                                            | Comando / verificación                                                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protección devuelve los checks requeridos           | `gh api repos/Frank-0511/vite-mhb-email/branches/master/protection --jq '[.required_status_checks.checks[].context] \| sort'` → `["Accessibility & Contrast Audit","CI Pipeline"]`; además `enforce_admins.enabled == true` |
| Workflow contiene la lista de exclusión             | `rg -c "@maizzle/\*\|maizzle\|tailwindcss\|postcss\|autoprefixer\|juice\|handlebars" .github/workflows/dependabot-automerge.yml` y lectura: la lista aparece solo en `MANUAL_REVIEW_DEPS`                                   |
| La clasificación excluye críticos (incl. agrupados) | Simulación local del bloque bash con entradas `tailwindcss`, `@maizzle/framework`, `fs-extra, juice` → `manual=true`; `fs-extra`, `@types/node` → `manual=false`. Semiautomática: salida adjunta en `STATUS.md`             |
| No fusiona con checks en rojo                       | Manual (paso 4): PR de prueba con `CI Pipeline` rojo y `mergeStateStatus` = `BLOCKED`; enlace en `STATUS.md`                                                                                                                |
| `dependabot.yml` incluye `github-actions`           | `rg -n 'package-ecosystem: "github-actions"' .github/dependabot.yml`                                                                                                                                                        |
| Formato y diff limpios                              | `bun run format:check` (cubre YAML) y `git diff --check`                                                                                                                                                                    |

Nota: `bun run lint` no analiza YAML; la sintaxis de los workflows la valida
GitHub al abrir el PR de la rama (el workflow de auto-merge se evalúa y se
omite por `if: github.actor == 'dependabot[bot]'`). Se declara como riesgo
residual, sin añadir `actionlint` (dependencia fuera de alcance).

## 6. Validación y gates

- Automática: `bun run check:task-branch`, `bun run format:check`,
  `bun run lint:md` (CHANGELOG/STATUS), `git diff --check`,
  `bun run check:dist-baseline` (gate de salida obligatorio; `dist/` no cambia).
- Manual: PR de prueba bloqueado (P8) y confirmación del usuario en
  Settings → Branches.
- Evidencia: salida de la API de protección, diff de ambos archivos de
  `.github/`, salida de la simulación de clasificación y enlace/captura del PR
  bloqueado.

## 7. Análisis de mantenibilidad

1. **Inventario:** `dependabot-automerge.yml` (28 líneas → ~45 estimadas),
   `dependabot.yml` (11 → ~35), `CHANGELOG.md` y `STATUS.md` (solo texto). Sin
   código fuente TS; límites de 250 líneas no aplican.
2. **Responsabilidad única:** `dependabot.yml` decide qué PR se abren y cómo se
   agrupan; el workflow decide cuáles se fusionan solos; la protección decide
   qué se exige para fusionar. Ninguno duplica al otro.
3. **Duplicación:** la lista crítica aparece en el workflow (`MANUAL_REVIEW_DEPS`)
   y en `exclude-patterns` de `dependabot.yml`, porque Dependabot no admite
   referencias compartidas. Se documenta con un comentario cruzado en ambos
   archivos; la fuente de verdad para el merge es el workflow.
4. **Carpetas:** `.github/workflows/` queda con 3 archivos; sin cambios de
   estructura.

## 8. Riesgos y reversión

| Riesgo                                                         | Mitigación / reversión                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Un check inestable bloquea todo merge                          | `DELETE …/protection` o edición en Settings; los checks requeridos son solo 2 agregados.                    |
| Renombrar un job rompe el check requerido (PR queda esperando) | Nota en `STATUS.md`: todo cambio de `name:` de `CI Pipeline` o del audit exige actualizar la protección.    |
| `enforce_admins` impide un hotfix directo                      | Desactivarlo temporalmente desde Settings, con registro en `STATUS.md`.                                     |
| Patrón de exclusión demasiado amplio o estrecho                | Simulación con casos límite (`@tailwindcss/vite`, `postcss-*`): se tratan como manuales, sesgo conservador. |
| `update-type` de un PR agrupado refleja el mayor salto         | Un grupo con un major queda manual; aceptable.                                                              |
| Workflows                                                      | Un commit por archivo (`ci(dependabot): …`), revertibles por separado.                                      |

## 9. Exclusiones

- No cambiar `ci.yml`, `audit.yml`, permisos de `GITHUB_TOKEN`, runtime del CI
  (MHB-36), templates ni `dist/`.
- No crear rulesets (el criterio usa la API clásica de protección).
- No tocar configuración del repositorio fuera de la protección de `master`
  (métodos de merge, `delete_branch_on_merge`, CodeQL) sin aprobación aparte.

## 10. Commits previstos

1. ✅ `f295888` — `docs(status): iniciar MHB-45 en progreso y archivar MHB-41 en historial`
2. `ci(dependabot): excluir dependencias del pipeline de email del auto-merge`
3. `ci(dependabot): añadir ecosistema github-actions y agrupar actualizaciones`
4. `docs(changelog): registrar cambios de MHB-45 bajo unreleased`
5. `docs(status): registrar entrega de MHB-45 en revision`

Revisor: orquestador con skill `task-review`; la configuración de GitHub la
confirma el usuario.
