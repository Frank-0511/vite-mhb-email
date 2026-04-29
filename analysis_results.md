# 📊 Análisis de vite-mhb-email — Mejoras propuestas

## Estado actual del proyecto

Tu proyecto es una herramienta sólida y bien estructurada. Integra Maizzle + Handlebars + Vite de forma inteligente, con un CLI completo, preview en vivo, component library, y un pipeline de build que produce HTML listo para ESPs. Es notablemente más maduro que la mayoría de boilerplates de email.

### ✅ Fortalezas actuales

| Área | Detalle |
|------|---------|
| **Arquitectura** | Separación limpia: plugins Vite, CLI modular, scripts de build independientes |
| **DX (Developer Experience)** | Hot reload, JSON editor reactivo, dark mode toggle, preview en vivo |
| **Pipeline de build** | CSS switch, media query injection, HTML size check, flatten automático |
| **CLI** | 7 opciones funcionales, validación de `.env`, `--help`, build automático si falta `dist/` |
| **Envío/testing** | Mailtrap sandbox, Mail-Tester, bandeja real, exportación a PNG |
| **Calidad de código** | ESLint, Prettier, HTMLHint, markdownlint, Husky + lint-staged, JSDoc |

---

## 🔴 Importancia CRÍTICA

### 1. Testing automatizado (unit + integration)

**Categoría:** Experiencia de codificación

El proyecto **no tiene ningún test**. Esto es la mejora más importante porque:
- El pipeline de build tiene lógica compleja (CSS switching, media query injection, Handlebars compilation) que puede romperse silenciosamente
- Los scripts de CLI manejan envío de emails que necesitan validación
- Cada refactor futuro es un riesgo sin red de seguridad

**Propuesta:**
- Agregar Vitest (integración nativa con Vite)
- Tests unitarios para: `compileTemplate()`, `applyHandlebars()`, `checkHtmlSize()`, `injectEmailMediaQueries()`, `loadEnv()`, `checkEnv()`, validadores JSON
- Tests de integración para el build pipeline completo (build → verify output)
- Agregar `yarn test` al script de CI y al pre-commit hook

---

### 2. Validación de compatibilidad con clientes de email (HTML Email Linting)

**Categoría:** Herramienta de email

Actualmente no hay ninguna validación de que el HTML producido sea compatible con Outlook, Gmail, Apple Mail, etc. El `htmlhint` solo valida sintaxis genérica, no reglas de email.

**Propuesta:**
- Integrar [email-comb](https://codsen.com/os/email-comb) o reglas custom post-build que validen:
  - No usar propiedades CSS no soportadas (ej: `flexbox` en Outlook)
  - No usar `<div>` sin fallback `<table>` para Outlook
  - Verificar que todo CSS esté inlineado donde debe
  - Verificar alt text en todas las `<img>`
  - Verificar que no haya clases sin purge en el build final
- Agregar como paso post-build con reporte visual (✅/⚠️/❌)
- **CLI opción nueva:** `[8] 🔍 Validar compatibilidad email`

---

### 3. Librería de partials/componentes reutilizables vacía

**Categoría:** Herramienta de email

Los directorios `src/partials/atoms/` y `src/partials/molecules/` están **vacíos**. Solo existe `organisms/hero`. La Component Library existe como feature pero casi no tiene contenido utilizable.

**Propuesta:** Crear un set base de componentes email-safe:

| Tipo | Componentes |
|------|-------------|
| **Atoms** | `button`, `heading`, `paragraph`, `image`, `spacer`, `divider`, `badge`, `social-icon` |
| **Molecules** | `feature-row` (icono + texto), `stat-card`, `testimonial`, `pricing-row`, `notification-bar`, `image-text-row` |
| **Organisms** | `hero` (ya existe), `feature-grid`, `pricing-table`, `footer-social`, `header-nav`, `cta-section` |

Cada uno con `schema.json`, variantes (v1, v2), y props configurables desde la Component Library.

---

## 🟠 Importancia ALTA

### 4. Sistema de templates/presets para el generador

**Categoría:** Herramienta de email

Actualmente `generate-email.js` genera un template mínimo idéntico siempre. No hay variedad.

**Propuesta:**
- Al crear un nuevo template, ofrecer elegir un preset:
  - `welcome` — Email de bienvenida con hero + features
  - `transactional` — Confirmación de pedido/acción
  - `newsletter` — Header + N bloques de contenido
  - `notification` — Alerta simple con CTA
  - `reset-password` — Flujo de reset de contraseña
  - `blank` — Template vacío (actual)
- Cada preset incluye un `index.html` y `data.json` pre-populados con contenido de ejemplo
- Se integra como submenú en la opción `[3]` del CLI

---

### 5. Vista responsive (mobile preview)

**Categoría:** Herramienta de email

El preview actual solo muestra desktop (600px). No hay forma de ver cómo se ve el email en mobile (320-375px), que es donde el **60%+** de los emails se abren.

**Propuesta:**
- Agregar toggle de viewport en la barra del preview: `Desktop (600px)` | `Mobile (375px)` | `Custom`
- El iframe ajusta su `width` dinámicamente
- Persistir la preferencia en `localStorage`
- Barra inferior con indicador visual del ancho actual

---

### 6. Copiar HTML al clipboard desde el dashboard

**Categoría:** Herramienta de email

Para usar el template en SendGrid/Mailchimp, el usuario tiene que abrir `dist/welcome.html`, copiar el contenido, y pegarlo. No hay acceso directo desde la UI.

**Propuesta:**
- Botón "📋 Copiar HTML" en la página de preview (junto a "Guardar")
- Copia el HTML compilado (con Handlebars aplicado) al clipboard
- Feedback visual: "¡Copiado!" con animación
- Variante: "Copiar HTML para SendGrid" (preserva `{{ }}`) vs "Copiar HTML renderizado" (reemplaza variables)

---

### 7. Watch mode en el build

**Categoría:** Experiencia de codificación

El build actual es one-shot. Si estás iterando sobre el output de producción (revisando el HTML final con CSS inline), hay que correr `yarn build` manualmente cada vez.

**Propuesta:**
- `yarn build --watch` que observe cambios en `src/` y re-compile automáticamente
- Usar `chokidar` o el file watcher de Node.js
- Solo recompilar el template que cambió (build incremental)
- Agregar como opción en el CLI: `[2b] 📦 Build + Watch`

---

### 8. Soporte multi-ESP (no solo SendGrid)

**Categoría:** Herramienta de email

Los delimitadores `{{ }}` están hardcodeados para SendGrid. Otros ESPs usan sintaxis distinta:
- Mailchimp: `*|VARIABLE|*`
- HubSpot: `{{ contact.property }}`
- Klaviyo: `{{ person.property }}`

**Propuesta:**
- Configuración en `data.json` o un `esp.config.json` que permita elegir el ESP target
- El build transforma las variables `{{ }}` al formato del ESP elegido
- Opción en el CLI al buildear: "¿Para qué ESP?" o un flag `yarn build --esp=mailchimp`

---

## 🟡 Importancia MEDIA

### 9. Historial de versiones de templates

**Categoría:** Herramienta de email

No hay manera de ver versiones anteriores de un template. Si alguien edita el `data.json` desde la UI y guarda, el estado anterior se pierde.

**Propuesta:**
- Antes de cada save, crear un backup en `.template-history/welcome/2026-04-28T19-35-39.json`
- Botón "📜 Ver historial" en la UI del editor
- Posibilidad de restaurar una versión anterior

---

### 10. Preview de texto plano (plain text fallback)

**Categoría:** Herramienta de email

Los emails profesionales siempre incluyen una versión plain text como fallback. Actualmente no hay generación ni preview de esto.

**Propuesta:**
- Post-build: generar automáticamente `dist/welcome.txt` a partir del HTML (strip tags, preservar estructura)
- Preview tab en la UI: `HTML` | `Plain Text` | `Source`
- El envío vía CLI incluye automáticamente el plain text como `multipart/alternative`

---

### 11. Accessibility checker (a11y)

**Categoría:** Herramienta de email

No hay validación de accesibilidad en los emails generados.

**Propuesta:**
- Verificar post-build:
  - `alt` en todas las `<img>`
  - `role="presentation"` en tablas de layout
  - Contraste de colores (text vs background)
  - `lang` attribute en `<html>`
  - Heading hierarchy
- Reporte integrado en el build output y como tab en el dashboard

---

### 12. Exportación a múltiples formatos

**Categoría:** Herramienta de email

Solo se exporta a PNG. Pero para presentaciones, documentación o stakeholders sería útil tener más opciones.

**Propuesta:**
- Exportar a: PNG (ya existe), PDF, MJML (reverse-engineer), y un ZIP con HTML + assets
- El ZIP es especialmente útil para entregar a equipos de marketing

---

### 13. Sistema de variables globales/brand tokens

**Categoría:** Herramienta de email

Los valores de marca (nombre empresa, colores, logo URL, dirección, etc.) están **hardcodeados** en los layouts y templates: `"Mi Empresa"`, `"Calle Ejemplo 123"`, colores hex, etc.

**Propuesta:**
- Crear `src/brand.json` con tokens:
  ```json
  {
    "company_name": "Mi Empresa",
    "logo_url": "https://...",
    "primary_color": "#0ea5e9",
    "address": "Calle Ejemplo 123, Ciudad, País",
    "social": { "twitter": "...", "linkedin": "..." }
  }
  ```
- Los layouts y partials consumen estos tokens vía `[[ page.brand.company_name ]]`
- El CLI ofrece un wizard para configurar estos valores inicialmente

---

### 14. Inline source code viewer en la UI

**Categoría:** Experiencia de codificación

Desde el preview no hay forma de ver el HTML source del template compilado sin abrir archivos manualmente.

**Propuesta:**
- Tab "Source" en el preview que muestre el HTML generado con syntax highlighting
- Botón para ver el diff entre el source y el build output
- Útil para debugging de CSS inline y media queries

---

### 15. Hot reload mejorado (HMR granular)

**Categoría:** Experiencia de codificación

Actualmente el preview recarga el iframe completo con cada cambio. Con templates complejos esto puede causar flashes.

**Propuesta:**
- Implementar partial updates: si solo cambia el `data.json`, solo re-renderizar el Handlebars sin recompilar Maizzle
- Si cambia el HTML, hacer full reload
- Reducir el debounce de 300ms a algo adaptativo

---

### 16. CI/CD Pipeline (GitHub Actions)

**Categoría:** Experiencia de codificación

No hay pipeline de CI/CD configurado.

**Propuesta:**
- GitHub Action que en cada PR:
  1. `yarn lint` 
  2. `yarn test` (cuando existan tests)
  3. `yarn build`
  4. Verificar size limits
  5. Generar screenshots de los templates y adjuntarlos como artefactos del PR
- Badge de status en el README

---

### 17. TypeScript gradual (JSDoc → TS)

**Categoría:** Experiencia de codificación

El proyecto usa `// @ts-check` en algunos archivos y JSDoc en otros, pero no hay type-checking real.

**Propuesta:**
- Agregar `tsconfig.json` con `allowJs: true` y `checkJs: true`
- Configurar el build para que `tsc --noEmit` valide tipos
- Gradualmente migrar archivos críticos a `.ts` (empezando por `utils.js` y `compile.js`)
- Agregar al pre-commit hook

---

## 🟢 Importancia BAJA (nice-to-have)

### 18. Dashboard analytics

**Categoría:** Herramienta de email

Métricas en el dashboard: cuántos templates hay, cuántos están buildeados, tamaño promedio, último build, etc.

---

### 19. Drag & drop template ordering

**Categoría:** Herramienta de email

Permitir reordenar las tarjetas del dashboard arrastrándolas. Guardar el orden en un `dashboard.config.json`.

---

### 20. Template tags/categories

**Categoría:** Herramienta de email

Agregar tags/categorías a los templates (ej: "transactional", "marketing", "onboarding") para filtrarlos en el dashboard cuando haya muchos.

---

### 21. i18n support (multi-idioma)

**Categoría:** Herramienta de email

Soporte para generar el mismo template en múltiples idiomas con archivos de traducción (`data.es.json`, `data.en.json`).

---

### 22. Custom Handlebars helpers

**Categoría:** Herramienta de email

Registrar helpers personalizados de Handlebars: `{{formatDate date}}`, `{{currency amount}}`, `{{truncate text 50}}`, etc. Actualmente solo hay replacement básico.

---

### 23. Storybook-like isolated testing para componentes

**Categoría:** Experiencia de codificación

La Component Library ya existe, pero podría tener un modo "test" donde se prueban automáticamente todas las combinaciones de props.

---

### 24. Plugin architecture para extensiones

**Categoría:** Experiencia de codificación

Permitir que otros desarrolladores agreguen plugins (nuevos ESPs, nuevos formatos de export, nuevos validators) sin modificar el core.

---

### 25. Config file unificado

**Categoría:** Experiencia de codificación

Actualmente hay: `maizzle.config.js`, `tailwind.config.js`, `tailwind.email.config.js`, `postcss.config.js`, `vite.config.js`, `.prettierrc.json`, `.htmlhintrc`, `.editorconfig`, `eslint.config.js`. Podría consolidarse lo propio del proyecto en un solo `mhb.config.js`.

---

## Resumen por prioridad

| Prioridad | # | Mejora | Categoría |
|-----------|---|--------|-----------|
| 🔴 Crítica | 1 | Testing automatizado | Codificación |
| 🔴 Crítica | 2 | Validación compatibilidad email | Email |
| 🔴 Crítica | 3 | Librería de componentes reutilizables | Email |
| 🟠 Alta | 4 | Presets para el generador de templates | Email |
| 🟠 Alta | 5 | Vista responsive (mobile preview) | Email |
| 🟠 Alta | 6 | Copiar HTML al clipboard | Email |
| 🟠 Alta | 7 | Watch mode en build | Codificación |
| 🟠 Alta | 8 | Soporte multi-ESP | Email |
| 🟡 Media | 9 | Historial de versiones | Email |
| 🟡 Media | 10 | Preview plain text | Email |
| 🟡 Media | 11 | Accessibility checker | Email |
| 🟡 Media | 12 | Exportación multi-formato | Email |
| 🟡 Media | 13 | Brand tokens globales | Email |
| 🟡 Media | 14 | Inline source viewer | Codificación |
| 🟡 Media | 15 | HMR granular | Codificación |
| 🟡 Media | 16 | CI/CD Pipeline | Codificación |
| 🟡 Media | 17 | TypeScript gradual | Codificación |
| 🟢 Baja | 18 | Dashboard analytics | Email |
| 🟢 Baja | 19 | Drag & drop ordering | Email |
| 🟢 Baja | 20 | Template tags/categories | Email |
| 🟢 Baja | 21 | i18n (multi-idioma) | Email |
| 🟢 Baja | 22 | Custom Handlebars helpers | Email |
| 🟢 Baja | 23 | Isolated component testing | Codificación |
| 🟢 Baja | 24 | Plugin architecture | Codificación |
| 🟢 Baja | 25 | Config unificado | Codificación |

---

> [!TIP]
> **Recomendación de roadmap:** Empezar con **#1 (Testing)** + **#3 (Componentes)** en paralelo. Testing te da la red de seguridad para todo lo demás, y los componentes son lo que más valor visible agrega a la herramienta. Después **#5 (Mobile preview)** + **#6 (Copy HTML)** son quick wins de alto impacto.
