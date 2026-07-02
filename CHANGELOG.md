# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-07-01

### Added

- `bun run test` and `bun run test:watch` scripts connected to the built-in
  `bun test` runner (`bunfig.toml` scoped to `**/*.test.js`, excludes `dist/`
  and `node_modules`).
- Smoke test for `getProjectPaths` in `scripts/shared/` to validate test
  discovery outside `src/web/`.
- Build gate: `bun run build` now exits with code 1 when the compatibility
  validator reports ERROR-level issues; WARNINGs remain non-blocking.
- `validateEmailHtml()` returns structured `{ errors, warnings, infos }` counts
  and accepts `distDirOverride` for isolated test usage.
- `tsconfig.json` with `allowJs`, `checkJs`, `noEmit`, `module: nodenext`, and
  `types: ["node"]`; scope limited to `scripts/shared/**` and `scripts/build/**`
  (excludes `*.test.js` and `dist/`).
- `bun run typecheck` script backed by `tsc --noEmit` (devDep `typescript@6.0.3`
  and `@types/node@26.0.1`).
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): path-filtered jobs
  for `lint:md`, `lint:html`, `lint:js`, `lint:json`, `lint:css`; unified
  `verify` job for `typecheck → test → build`; Bun cache keyed on `bun.lock`.
- `screenshots/dashboard.png`, `screenshots/email-welcome-desktop.png`,
  `screenshots/email-welcome-mobile.png` — real screenshots embedded in README.

### Changed

- `src/emails/layouts/layout-tenpo.html` renamed to `layout-alt.html`; content
  fully genericized (logo, social links, and legal text replaced with `{{ }}`
  variables and `[[logoFooter]]`).
- `src/emails/partials/organisms/supporting-section/index.html`: hardcoded
  image URLs replaced with `{{ support_icon_url }}` and
  `{{ support_arrow_icon_url }}` ESP variables.
- `package.json` `lint:md` glob: removed obsolete `#analysis_results.md`
  exclusion.
- `README.md`: restructured to include problem/solution framing,
  architecture diagram, CI badge, `test`/`typecheck` commands, and embedded
  screenshots.
- `package.json` version bumped from `1.0.0` to `1.1.0`.

### Fixed

- `dist/` confirmed in `.gitignore`; build artefacts are never committed.
- Build no longer silently ignores compatibility validation errors.

[Unreleased]: https://github.com/Frank-0511/vite-mhb-email/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.1.0
