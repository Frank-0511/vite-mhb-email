# Workflow and Git Skill

Usa esta skill cuando ejecutes comandos, verifiques cambios, prepares commits o
toques el flujo de desarrollo.

## Comandos Autorizados

Usa Bun como interfaz oficial:

```bash
bun install
bun run dev
bun run build
bun run lint
bun run validate-email
bun run cli
bun run format
bun run format:check
```

Reglas:

- Usa `bun run <script>` para scripts del proyecto.
- No uses `npm`, `npx`, `yarn` ni `pnpm` salvo autorizacion explicita.
- Si una verificacion falla, investiga la causa.
- No relajes reglas para obtener una salida verde.

## Verificacion Minima

- Docs: `bun run lint:md` o `bun run lint` si es barato.
- JS: `bun run lint`.
- Templates/layouts/CSS email: `bun run build` y `bun run validate-email`.
- Preview/dashboard: `bun run lint` y prueba manual en `bun run dev` si toca UI.
- CLI: ejecutar la accion afectada o aislar helper verificable.
- Exportacion: probar el comando afectado o documentar bloqueo por binarios
  externos.

No declares un cambio terminado sin indicar que verificacion ejecutaste.

## Build Pipeline

- El build debe ser idempotente.
- Toda mutacion temporal del filesystem debe restaurarse en `finally` o flujo
  equivalente.
- Cada etapa debe emitir mensajes utiles.
- Si una etapa falla, el proceso debe terminar con exit code distinto de cero.
- No agregues pasos dependientes de estado global no documentado.

## Git

Usa Conventional Commits estrictos:

```text
<type>(<scope>): <descripcion imperativa en minusculas>
```

Tipos permitidos:

- `feat`;
- `fix`;
- `refactor`;
- `perf`;
- `test`;
- `docs`;
- `build`;
- `ci`;
- `chore`;
- `style`.

Ejemplos:

```text
feat(preview): agrega selector de viewport responsive
fix(build): restaura css de preview ante fallo de maizzle
refactor(vite-api): extrae validacion de rutas de templates
docs(agents): divide instrucciones en skills locales
```

Reglas:

- No mezcles cambios no relacionados en un commit.
- No hagas commit de `dist/`, screenshots, logs o artefactos temporales salvo
  pedido explicito.
- Antes de commitear, revisa `git diff`.
- No reescribas historial ni descartes cambios del usuario.

## Working Tree

- Respeta cambios existentes.
- No reviertas archivos que no tocaste.
- Si un cambio ajeno afecta tu tarea, trabaja con el estado actual.
- Si el estado hace imposible continuar, explica el bloqueo.
