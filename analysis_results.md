# 📊 Análisis de vite-mhb-email — Mejoras propuestas

## Estado actual del proyecto

Tu proyecto es una herramienta sólida y bien estructurada. Integra Maizzle + Handlebars + Vite de forma inteligente, con un CLI completo, preview en vivo, component library, y un pipeline de build que produce HTML listo para ESPs. Recientemente se ha añadido un sistema automático de validación de compatibilidad con clientes de email (Outlook, Gmail, etc.) y una vista responsive (Desktop/Mobile/Custom) en el preview, lo que lo hace notablemente más maduro que la mayoría de boilerplates de email.

### ✅ Fortalezas actuales

| Área                          | Detalle                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| **Arquitectura**              | Separación limpia: plugins Vite, CLI modular, scripts de build independientes             |
| **DX (Developer Experience)** | Hot reload, JSON editor reactivo, dark mode toggle, preview en vivo + viewport responsive |
| **Pipeline de build**         | CSS switch, media query injection, HTML size check, validación de compatibilidad email    |
| **CLI**                       | 8 opciones funcionales, validación de `.env`, `--help`, build automático si falta `dist/` |
| **Envío/testing**             | Mailtrap sandbox, Mail-Tester, bandeja real, validador automático de reglas de email      |
| **Calidad de código**         | ESLint, Prettier, HTMLHint, markdownlint, Email Compatibility Validator, JSDoc            |

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
- Agregar `bun run test` al script de CI y al pre-commit hook

---

### 2. Validación de compatibilidad con clientes de email (HTML Email Linting) ✅ Implementado

**Categoría:** Herramienta de email

Se ha implementado un sistema de diagnóstico que analiza los archivos en `dist/` detectando 12 reglas críticas de renderizado (flexbox, gap, dimensiones de imagen, doctype, scripts, etc.).

**Implementación:**

- **Core:** `scripts/build/validate-email-html.js` con soporte para severidades (ERROR/WARNING/INFO).
- **Reglas:** 12 validadores que detectan problemas comunes como `display: flex`, falta de `alt`, o links rotos `#`.
- **Pipeline:** Integrado automáticamente en `bun run build`.
- **CLI:** Opción `[8] 🔍 Validar compatibilidad email` añadida para ejecución manual.

---

### 3. Librería de partials/componentes reutilizables vacía

**Categoría:** Herramienta de email

Los directorios `src/partials/atoms/` y `src/partials/molecules/` están **vacíos**. Solo existe `organisms/hero`. La Component Library existe como feature pero casi no tiene contenido utilizable.

**Propuesta:** Crear un set base de componentes email-safe:

| Tipo          | Componentes                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Atoms**     | `button`, `heading`, `paragraph`, `image`, `spacer`, `divider`, `badge`, `social-icon`                         |
| **Molecules** | `feature-row` (icono + texto), `stat-card`, `testimonial`, `pricing-row`, `notification-bar`, `image-text-row` |
| **Organisms** | `hero` (ya existe), `feature-grid`, `pricing-table`, `footer-social`, `header-nav`, `cta-section`              |

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

### 5. Vista responsive (mobile preview) ✅ Implementado

**Categoría:** Herramienta de email

El preview ahora permite alternar rápidamente entre desktop, mobile y un ancho personalizado para validar rendering en tamaños típicos de email.

**Implementación:**

- Toggle de viewport en la barra superior: `Desktop (600px)` | `Mobile (375px)` | `Custom`
- El iframe ajusta su ancho dinámicamente (centrado en el panel de preview)
- Preferencia persistida en `localStorage`
- Barra inferior con indicador del ancho actual

---

### 6. Copiar HTML al clipboard desde el dashboard ✅

**Categoría:** Herramienta de email

Permite al usuario copiar el HTML compilado directamente desde la UI del preview sin tener que navegar a los archivos.

**Implementación:**

- Botón "📋 Copiar HTML" en la página de preview (junto a "Guardar")
- Copia el HTML compilado (con Handlebars aplicado) al clipboard
- Feedback visual: "¡Copiado!" con animación
- Variante: "Copiar HTML para SendGrid" (preserva `{{ }}`) vs "Copiar HTML renderizado" (reemplaza variables)

---

### 7. Watch mode en el build ❌ Descartado

**Categoría:** Experiencia de codificación

**Estado:** Descartado por ahora. El flujo de build bajo demanda para copiar HTML cubre la necesidad principal sin añadir complejidad de watchers.

El build actual es one-shot. Si estás iterando sobre el output de producción (revisando el HTML final con CSS inline), hay que correr `bun run build` manualmente cada vez.

**Propuesta:**

- `bun run build --watch` que observe cambios en `src/` y re-compile automáticamente
- Usar `chokidar` o el file watcher de Node.js
- Solo recompilar el template que cambió (build incremental)
- Agregar como opción en el CLI: `[2b] 📦 Build + Watch`

---

### 8. Soporte multi-ESP (no solo SendGrid) ❌ Descartado

**Categoría:** Herramienta de email

**Estado:** Descartado por ahora. El enfoque actual del proyecto se mantiene en un solo ESP para reducir complejidad y superficie de mantenimiento.

Los delimitadores `{{ }}` están hardcodeados para SendGrid. Otros ESPs usan sintaxis distinta:

- Mailchimp: `*|VARIABLE|*`
- HubSpot: `{{ contact.property }}`
- Klaviyo: `{{ person.property }}`

**Propuesta:**

- Configuración en `data.json` o un `esp.config.json` que permita elegir el ESP target
- El build transforma las variables `{{ }}` al formato del ESP elegido
- Opción en el CLI al buildear: "¿Para qué ESP?" o un flag `bun run build --esp=mailchimp`

---

## 🟡 Importancia MEDIA

### 9. Historial de versiones de templates ❌ Descartado

**Categoría:** Herramienta de email

**Estado:** Descartado por ahora. No es prioridad frente a mejoras directas del pipeline y del preview/build productivo.

No hay manera de ver versiones anteriores de un template. Si alguien edita el `data.json` desde la UI y guarda, el estado anterior se pierde.

**Propuesta:**

- Antes de cada save, crear un backup en `.template-history/welcome/2026-04-28T19-35-39.json`
- Botón "📜 Ver historial" en la UI del editor
- Posibilidad de restaurar una versión anterior

---

### 10. Preview de texto plano (plain text fallback) ❌ Descartado

**Categoría:** Herramienta de email

**Estado:** Descartado por ahora. No hay necesidad operativa inmediata y agrega una rama extra de mantenimiento en UI y envío.

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
  1. `bun run lint`
  2. `bun run test` (cuando existan tests)
  3. `bun run build`
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

| Prioridad  | #   | Mejora                                 | Status        | Categoría    |
| ---------- | --- | -------------------------------------- | ------------- | ------------ |
| 🔴 Crítica | 1   | Testing automatizado                   | 🟠 Parcial    | Codificación |
| 🔴 Crítica | 2   | Validación compatibilidad email ✅     | ✅ Listo      | Email        |
| 🔴 Crítica | 3   | Librería de componentes reutilizables  | 🟠 Parcial    | Email        |
| 🟠 Alta    | 4   | Presets para el generador de templates | ⚪ Pendiente  | Email        |
| 🟠 Alta    | 5   | Vista responsive (mobile preview) ✅   | ✅ Listo      | Email        |
| 🟠 Alta    | 6   | Copiar HTML al clipboard ✅            | ✅ Listo      | Email        |
| 🟠 Alta    | 7   | Watch mode en build                    | ❌ Descartado | Codificación |
| 🟠 Alta    | 8   | Soporte multi-ESP                      | ❌ Descartado | Email        |
| 🟡 Media   | 9   | Historial de versiones                 | ❌ Descartado | Email        |
| 🟡 Media   | 10  | Preview plain text                     | ❌ Descartado | Email        |
| 🟡 Media   | 11  | Accessibility checker                  | ⚪ Pendiente  | Email        |
| 🟡 Media   | 12  | Exportación multi-formato              | 🟠 Parcial    | Email        |
| 🟡 Media   | 13  | Brand tokens globales                  | ⚪ Pendiente  | Email        |
| 🟡 Media   | 14  | Inline source viewer                   | ⚪ Pendiente  | Codificación |
| 🟡 Media   | 15  | HMR granular                           | ⚪ Pendiente  | Codificación |
| 🟡 Media   | 16  | CI/CD Pipeline                         | ⚪ Pendiente  | Codificación |
| 🟡 Media   | 17  | TypeScript gradual                     | 🟠 Parcial    | Codificación |
| 🟢 Baja    | 18  | Dashboard analytics                    | ⚪ Pendiente  | Email        |
| 🟢 Baja    | 19  | Drag & drop ordering                   | ⚪ Pendiente  | Email        |
| 🟢 Baja    | 20  | Template tags/categories               | ⚪ Pendiente  | Email        |
| 🟢 Baja    | 21  | i18n (multi-idioma)                    | ⚪ Pendiente  | Email        |
| 🟢 Baja    | 22  | Custom Handlebars helpers              | ⚪ Pendiente  | Email        |
| 🟢 Baja    | 23  | Isolated component testing             | ⚪ Pendiente  | Codificación |
| 🟢 Baja    | 24  | Plugin architecture                    | ⚪ Pendiente  | Codificación |
| 🟢 Baja    | 25  | Config unificado                       | ⚪ Pendiente  | Codificación |

---

> [!TIP] > **Recomendación de roadmap:** Empezar con **#1 (Testing)** + **#3 (Componentes)** en paralelo. Testing te da la red de seguridad para todo lo demás, y los componentes son lo que más valor visible agrega a la herramienta. **#6 (Copy HTML)** ya está completado ✅. Próximas prioridades: **#4 (Presets)** y **#7 (Watch mode)** son quick wins de alto impacto.
