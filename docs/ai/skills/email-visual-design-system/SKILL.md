---
name: email-visual-design-system
description: Aplicar o modificar el sistema visual Space Blue del dashboard web (tokens, temas dark/light, tipografía, contraste). Usar para cambios en docs/design/DESIGN.md, src/web/shared/styles/design-tokens.css o roles visuales dentro de src/web/**.
---

# Sistema visual web (Space Blue)

- Tratar `docs/design/DESIGN.md` como contrato congelado: colores, tipografía
  y escalas. No cambiar sus valores sin acuerdo explícito; extenderlo antes de
  inventar un token fuera de él.
- Consumir solo los tokens semánticos `--ef-*` de
  `src/web/shared/styles/design-tokens.css` en componentes. No hardcodear hex,
  rgb ni colores de Tailwind crudos; si falta un token, añadirlo ahí primero.
- Mantener dark como tema inicial y light como equivalente completo. Todo par
  texto/fondo e interactivo debe apuntar a contraste AA; no aceptar una
  variante sin su contraparte.
- Preservar la clave de storage `app-theme`, su control de teclado y el evento
  `theme-changed` sin renombrar ni duplicar el estado del tema.
- No agregar fuentes remotas, íconos externos ni dependencias CSS nuevas; usar
  la pila tipográfica y componentes ya definidos en el contrato.
- Verificar manualmente con `bun run dev` en 375px, 768px y 1440px, en dark y
  light: navegación, foco visible, contraste y que ninguna operación crítica
  quede oculta en móvil.
- Ejecutar `bun run lint`, `bun run format:check` y las pruebas focalizadas de
  la fase antes de cerrar.

Este dominio es el opuesto de `email-compatibility`: aquí sí se permite CSS
moderno (flex, grid, custom properties) porque el destino es un navegador, no
un cliente de correo. No aplicar las restricciones de esa skill a `src/web/**`.
Leer también `email-preview-dashboard` cuando el cambio cruce hacia estructura
DOM, APIs o interacción, y no tocar `src/emails/**`, iframes, Maizzle,
Handlebars, variables ESP ni APIs Vite desde esta skill.
