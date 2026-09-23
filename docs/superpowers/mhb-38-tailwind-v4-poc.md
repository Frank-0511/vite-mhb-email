# MHB-38 — Anexo técnico: migración en bloque a Maizzle 6 y Tailwind CSS v4

Artefacto temporal de la tarea. El contrato vinculante está en
`docs/implementation/PLAN.md` (sección MHB-38). Se elimina junto con
`docs/superpowers/` antes de preparar la PR.

Datos tomados del registry de npm y del código de los paquetes el 2026-09-23.
F0 debe revalidarlos al iniciar. Todo lo marcado como **supuesto** se confirma
en el checkpoint F2.

## 1. Decisión y calendario

| Hito              | Fecha / condición         | Acción                                                        |
| ----------------- | ------------------------- | ------------------------------------------------------------- |
| Hasta la revisión | 2026-09-23 → 2027-01-15   | Mantener Maizzle 5.5.0 + Tailwind 3.4.19 en email y dashboard |
| Revisión y PoC    | ≥ 2027-01-15 o disparador | F0–F2 y checkpoint Go / No-Go con el usuario                  |
| Fecha límite      | 2027-06-30                | Migración completa (F3–F6) mergeada                           |

**Disparadores que adelantan la ejecución:**

- `bun audit` reporta una vulnerabilidad en Maizzle 5 o Tailwind v3 sin corrección compatible.
- Hay incompatibilidad con el Node, Bun o Vite que exija el proyecto.
- Se necesita una capacidad exclusiva de Maizzle 6 o Tailwind v4.
- Maizzle anuncia el fin de soporte de la v5.

**Señales de madurez:** 60 días sin cambios que rompan compatibilidad en 6.x y
una API programática de render documentada.

**Estado del soporte (2026-09-23):**

| Paquete              | Última | Fecha      | Nota                                    |
| -------------------- | ------ | ---------- | --------------------------------------- |
| `@maizzle/framework` | 5.5.0  | 2026-02-12 | Sin parches 5.x tras 6.0.0 (2026-06-09) |
| `@maizzle/framework` | 6.1.7  | 2026-09-16 | ~20 versiones entre agosto y septiembre |
| `tailwindcss` v3-lts | 3.4.19 | 2025-12-10 | Tag `v3-lts` vigente                    |
| `tailwindcss`        | 4.3.3  | 2026-07-16 | Estable                                 |

## 2. Preparación en Git

```bash
git switch master
git pull --ff-only
git status --short
git switch -c feature/mhb-38
bun run check:task-branch
sha256sum dist/*.html > docs/superpowers/mhb-38/dist-baseline.sha256
```

El nombre `chore/...` no es válido: `check:task-branch` exige `feature/<id>` y
el ID activo en `STATUS.md`. La PoC (F2) vive en `docs/superpowers/mhb-38/poc/`
con su propio `package.json`, instalado con `bun install --cwd`, hasta el Go.

## 3. Matriz de dependencias

| Acción   | Paquete / archivo          | Versión actual → objetivo | Motivo                                            |
| -------- | -------------------------- | ------------------------- | ------------------------------------------------- |
| Eliminar | `postcss`                  | 8.5.12 → —                | Solo lo usaba `postcss.config.js` del dashboard   |
| Eliminar | `autoprefixer`             | 10.6.1 → —                | Tailwind v4 prefija con Lightning CSS             |
| Eliminar | `postcss.config.js`        | —                         | Sustituido por `@tailwindcss/vite`                |
| Eliminar | `tailwind.config.js`       | —                         | Tokens del dashboard pasan a CSS                  |
| Eliminar | `tailwind.email.config.js` | —                         | Tokens del email pasan a `@theme`                 |
| Subir    | `@maizzle/framework`       | 5.5.0 → 6.1.7             | Motor Vue + Vite con Tailwind v4                  |
| Subir    | `tailwindcss`              | 3.4.19 → 4.3.3            | Núcleo v4                                         |
| Subir    | `vite`                     | 8.0.10 → 8.3.0            | Maizzle 6 exige `^8.0.16`                         |
| Añadir   | `@tailwindcss/vite`        | — → 4.3.3                 | Plugin del dashboard                              |
| Añadir   | `@maizzle/tailwindcss`     | — → 1.5.6                 | Preset email: paleta HEX, `mso-*`, reset, screens |
| Mantener | `maizzle` (CLI)            | 1.2.4                     | Ya es la última                                   |
| Mantener | `handlebars`               | 4.7.9                     | Preview con `data.json`                           |

No hay plugins de email v3 que reemplazar (`plugins: []`); `@maizzle/tailwindcss/mso`
aporta las utilidades Outlook.

## 4. Inventario de sintaxis a portar (`src/emails`, 2026-09-23)

| Sintaxis PostHTML        | Archivos | Usos | Equivalente en Maizzle 6                              |
| ------------------------ | -------- | ---- | ----------------------------------------------------- |
| Archivos `.html`         | 17       | —    | `.vue` (6 templates, 1 layout, 10 partials)           |
| `[[ … ]]`                | 13       | 58   | Interpolación Vue mediante el plugin de delimitadores |
| `[[[ … ]]]` (sin escape) | 1        | 1    | `v-html` explícito (el plugin no lo convierte)        |
| `{{ … }}` ESP            | 17       | 57   | Protegido por el plugin y restaurado literal          |
| Bloques `{{#…}}`         | 0        | 0    | Cubierto igualmente por el plugin                     |
| `<x-…>`                  | 8        | 20   | Componentes Vue en PascalCase                         |
| `<if>`                   | 4        | 9    | `v-if`                                                |
| `<each>`                 | 1        | 1    | `v-for`                                               |
| `<yield>`                | 1        | 2    | `<slot />`                                            |

**Otras piezas afectadas:**

- `scripts/vite/services/render/maizzle-compiler.ts` y `component-preview-renderer.ts`.
- `scripts/vite/plugins/maizzle-dev-server.ts`, `scripts/vite/services/cache/preview-cache.ts` y `scripts/shared/io/paths.ts` (referencias a `tailwind.email.config.js`).
- `src/web/features/preview/modules/runtime/preview-hmr.ts`.
- El flatten y la limpieza de `maizzle.config.js`, y `getEmailComponentFolders`.

## 5. Plugin de delimitadores `[[ ]]` / `{{ }}`

Maizzle 6.1.7 fija las `compilerOptions` de Vue (`whitespace`, `isCustomElement`)
y no expone `delimiters`, pero acepta `config.vite.plugins` y el hook
`afterTransform`. Como Maizzle 6 puede renderizar en paralelo con `tinypool`,
el marcador codifica el texto original y no depende de estado compartido:

```ts
// scripts/shared/email/esp-delimiters.ts (propuesto)
import type { Plugin } from "vite";

const ESP_BLOCK = /\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\}/g;
const BUILD_EXPR = /\[\[\s*([\s\S]*?)\s*\]\]/g;
const MARKER = /ESPx([0-9a-f]+)x/g;

const encode = (raw: string): string => `ESPx${Buffer.from(raw).toString("hex")}x`;

/** Protege `{{ }}` del ESP y convierte `[[ ]]` en interpolación Vue. */
export function protectTemplate(template: string): string {
  return template.replace(ESP_BLOCK, encode).replace(BUILD_EXPR, "{{ $1 }}");
}

/** Restaura los `{{ }}` originales en el HTML final. */
export function restoreEsp(html: string): string {
  return html.replace(MARKER, (_, hex: string) => Buffer.from(hex, "hex").toString());
}

export function espDelimitersPlugin(): Plugin {
  return {
    name: "emailforge:esp-delimiters",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0]?.endsWith(".vue")) return null;
      return code.replace(
        /(<template>)([\s\S]*)(<\/template>)/,
        (_, open: string, body: string, close: string) => open + protectTemplate(body) + close,
      );
    },
  };
}
```

```ts
// maizzle.config.ts (supuesto: forma exacta de defineConfig en 6.x)
import { defineConfig } from "@maizzle/framework";
import { espDelimitersPlugin, restoreEsp } from "./scripts/shared/email/esp-delimiters.ts";

export default defineConfig({
  content: ["src/emails/templates/**/*.vue"],
  output: { path: "dist", extension: "html" },
  css: { inline: true, purge: true, shorthand: true, safe: true },
  vite: { plugins: [espDelimitersPlugin()] },
  afterTransform: ({ html }) => restoreEsp(html),
});
```

**Tests obligatorios del plugin:**

- Cubre `{{ first_name }}`, `{{{ raw }}}`, `{{#if x}}…{{/if}}`, ESP dentro de atributos (`href="{{ url }}"`) y `[[ page.title ]]`.
- El HTML minificado e inlinado conserva los marcadores hasta la restauración.
- No queda ningún `ESPx…x` en `dist/`, y la regla ESP existente sigue verde.

## 6. CSS con `@theme`

**Email** (`src/emails/styles/email.css`), equivalente de `tailwind.email.config.js`:

```css
@import "@maizzle/tailwindcss";

@custom-variant dark (@media (prefers-color-scheme: dark));

@theme {
  --breakpoint-sm: 600px;

  --color-main-50: #eeeeee;
  --color-main-200: #d0d0d0;
  --color-neutral-800: #2a2a2a;
  --color-neutral-900: #121212;
  --color-secondary-200: #99e1ff;
  --color-secondary-500: #00b2ff;

  --text-xxs: 10px;
  --text-xxs--line-height: 14px;
}
```

El preset ya importa `tailwindcss/utilities important` (equivale a
`important: true`) y su propio `reset.css` en lugar de preflight (equivale a
`preflight: false`).

**Dashboard** (`src/web/shared/styles/tailwind.css`), equivalente de `tailwind.config.js`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* w-4.5 y h-4.5 salen del --spacing dinámico (1.125rem);
   max-h-1000 sería 250rem en v4, así que se fija explícitamente. */
@utility max-h-1000 {
  max-height: 1000px;
}
```

```ts
// vite.config.ts: añadir el plugin y borrar postcss.config.js
import tailwindcss from "@tailwindcss/vite";
// plugins: [tailwindcss(), maizzlePlugin(rootDir), ...]
```

Cambios de v4 a revisar en el dashboard: borde por defecto `currentColor`,
`ring` de 1px, y renombres `shadow-sm→shadow-xs`, `rounded-sm→rounded-xs` y
`blur-sm→blur-xs`. `bunx @tailwindcss/upgrade --dry-run` sirve solo como referencia.

## 7. Plantilla del checkpoint F2

`welcome.vue` mínima (**supuesto**: forma de importar el layout y el CSS en 6.x):

```vue
<template>
  <table class="w-full bg-main-50 dark:bg-neutral-900" role="presentation">
    <tr>
      <td class="px-6 py-8 sm:px-4">
        <h1 class="text-neutral-800">[[ page.title ]]</h1>
        <span class="text-xxs text-neutral-800 dark:text-main-200">Hola {{ first_name }}</span>
        {{#if promo_code}}
        <p class="text-secondary-500">Código: {{ promo_code }}</p>
        {{/if}}
        <a
          href="{{ cta_url }}"
          class="mso-padding-alt-0 inline-block rounded bg-secondary-500 px-5 py-3 text-white"
          >Continuar</a
        >
        <p class="text-secondary-500/50">Opacidad sin color-mix()</p>
      </td>
    </tr>
  </table>
</template>
```

Salida **objetivo** (no es una salida real; se reemplaza por el snippet real en F2):

```html
<h1 style="color: #2a2a2a">Bienvenido</h1>
<span style="font-size: 10px; line-height: 14px; color: #2a2a2a">Hola {{ first_name }}</span>
{{#if promo_code}}
<p style="color: #00b2ff">Código: {{ promo_code }}</p>
{{/if}}
<a href="{{ cta_url }}" style="display: inline-block; background-color: #00b2ff; color: #fffffe"
  >Continuar</a
>
<p style="color: rgba(0, 178, 255, 0.5)">Opacidad sin color-mix()</p>
```

## 8. Auditoría del HTML compilado

La regla permanente `modern-css-inline` (F1) reutiliza el parser de
`scripts/validators/email-rules/context.ts`. Para la PoC basta un script
standalone:

```ts
// docs/superpowers/mhb-38/poc/audit.ts — bun audit.ts <archivo.html>
import { readFileSync } from "node:fs";

const MODERN_COLOR = /\b(?:oklch|oklab|lch|lab|color-mix|color)\(/i;
const INLINE_COLOR =
  /(?:^|;)\s*(?:color|background(?:-color)?|border(?:-[a-z]+)?-color)\s*:\s*([^;]+)/gi;
const SAFE_COLOR =
  /^(?:#[0-9a-f]{6}|#[0-9a-f]{3}|rgba?\([^)]*\)|transparent|inherit|currentcolor)(?:\s*!important)?$/i;

const file = process.argv[2];
if (!file) throw new Error("Uso: bun audit.ts <archivo.html>");
const html = readFileSync(file, "utf8");
const errors: string[] = [];

for (const [, style = ""] of html.matchAll(/style="([^"]*)"/gi)) {
  if (style.includes("var(--")) errors.push(`var() inline: ${style}`);
  if (MODERN_COLOR.test(style)) errors.push(`color moderno inline: ${style}`);
  for (const [, value = ""] of style.matchAll(INLINE_COLOR)) {
    if (!SAFE_COLOR.test(value.trim())) errors.push(`color no HEX/rgb: ${value}`);
  }
}
for (const [, css = ""] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
  if (MODERN_COLOR.test(css)) errors.push("color moderno en <style>");
}
for (const [, tag, attrs = ""] of html.matchAll(/<(table|td|th|span|a|p)\b([^>]*)>/gi)) {
  if (/class="[^"]*\b(?:bg|text|p[xy]?|m[xy]?|w|rounded)-/.test(attrs) && !/style="/.test(attrs)) {
    errors.push(`<${tag}> con utilidades sin style inline`);
  }
}
if (/ESPx[0-9a-f]+x/.test(html)) errors.push("marcador ESP sin restaurar");

console.log(errors.length === 0 ? "AUDIT OK" : errors.join("\n"));
process.exit(errors.length === 0 ? 0 : 1);
```

## 9. Checklist Go / No-Go

**Checkpoint F2** (antes de tocar la superficie productiva):

- [ ] Versiones revalidadas y señales de madurez cumplidas (o disparador registrado).
- [ ] `modern-css-inline` verde sobre el `dist/` actual y roja sobre fixtures negativos.
- [ ] `welcome.vue` compila: 0 `var(--` inline, 0 `oklch(`/`lch(`/`oklab(`/`color-mix(`, y colores en HEX o `rgb()`.
- [ ] Utilidades aplanadas en `style=""`; `<style>` solo con media queries, `dark:`, pseudo-clases y resets.
- [ ] `{{ first_name }}`, `{{#if}}…{{/if}}` y `href="{{ cta_url }}"` literales; `[[ page.title ]]` resuelto; sin marcadores `ESPx…x`.
- [ ] API programática de Maizzle 6 utilizable desde el preview con Handlebars.
- [ ] CSS del dashboard en v4 equivalente al de v3 (diff de selectores).
- [ ] El usuario aprueba seguir con F3.

**Antes de la PR:**

- [ ] Matriz automática completa en verde (§ Validación automática del contrato).
- [ ] Diff de `dist/*.html` frente al baseline justificado línea a línea; `check-size` dentro del umbral.
- [ ] Preview, biblioteca, HMR y dashboard sin regresiones (seis combinaciones ancho×tema).
- [ ] Gmail y Outlook revisados con envío autorizado, o `No ejecutado` con riesgo aceptado por el orquestador.
- [ ] Sin `postcss.config.js`, `tailwind*.config.js`, `autoprefixer` ni referencias a Maizzle 5 o Tailwind v3.

Un solo ítem fallido es **No-Go**.

## 10. Rollback

- **Antes del merge:** la rama no afecta a `master`. Para abandonar,
  `git switch master && git branch -D feature/mhb-38`, y se registra el
  resultado en `STATUS.md` con nueva fecha de revisión.
- **Después del merge:** `git revert -m 1 <merge-sha>` y luego
  `bun install --frozen-lockfile` restauran Maizzle 5 + Tailwind v3 y el
  `bun.lock` anterior. Verificar con `sha256sum -c dist-baseline.sha256` tras
  `bun run build`.
- **Parcial:** un commit por fase (F1 regla, F3 email por capa, F4 dashboard,
  F5 dependencias) permite revertir una fase sin perder la regla de auditoría.
