# Agent Notes

Project overview and workflow details live in [README.md](README.md).

## Quickstart

- Requires Node >=20 y Bun >=1.0.0.
- `bun install`
- `bun run dev` para el dashboard de Vite.
- `bun run build` ejecuta lint y el pipeline de emails.
- `bun run cli` abre el menú interactivo.

## Conventions and pitfalls

- Templates use dual delimiters: `[[ page.* ]]` for Maizzle and `{{ * }}` for ESP variables. Keep `{{ }}` intact; see [maizzle.config.js](maizzle.config.js).
- The build pipeline swaps preview vs email CSS and injects dark-mode media queries via [scripts/build/build.js](../scripts/build/build.js). Avoid running `maizzle build` directly unless you also handle the CSS swap/restore.
- Output is flattened to `dist/<template>.html` by [maizzle.config.js](../maizzle.config.js).
- Email validation runs during `bun run build`. Usa `bun run validate-email` cuando iteres.

## Key paths

- Template example: [src/templates/welcome/index.html](../src/templates/welcome/index.html) and [src/templates/welcome/data.json](../src/templates/welcome/data.json).
- Layouts: [src/layouts/main-light.html](../src/layouts/main-light.html) and [src/layouts/main-dark.html](../src/layouts/main-dark.html).
- Component example: [src/partials/organisms/hero/index.html](../src/partials/organisms/hero/index.html).
- CLI entry: [scripts/cli.js](../scripts/cli.js). Build entry: [scripts/build/build.js](../scripts/build/build.js).

## Commits

- Usa el formato [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) para los mensajes de commit (ejemplo: `feat: agrega validación de emails`).
