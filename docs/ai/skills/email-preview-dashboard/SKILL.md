---
name: email-preview-dashboard
description: Trabajar en el dashboard, preview, editor, biblioteca de componentes, UI Vite o APIs internas de EmailForge Toolkit. Usar para cambios en src/web, scripts/vite o interacción de preview.
---

# Preview y dashboard

- Mantener UI por feature: home, preview y library en `src/web/features/`; usar
  `src/web/shared/` solo para utilidades de dos o más features.
- Tratar la UI como herramienta de trabajo: seleccionar template, editar datos,
  renderizar, restaurar y compilar por el pipeline oficial.
- Mantener HTML estructural y mover lógica a módulos. Validar DOM obligatorio,
  centralizar claves de storage y aislar iframes.
- Manejar `fetch` con `response.ok`, red y payload inesperado. Implementar APIs
  como middlewares Vite, validar entradas y devolver status/mensajes accionables.
- Preservar `{{ }}` del ESP en preview y leer schemas de componentes en vez de
  duplicar contratos.
- Ejecutar `bun run lint`; si hay interacción visual, recorrer `bun run dev`.
  Ejecutar build/validación email cuando el cambio afecte render o HTML final.

Leer también `email-compatibility` y `email-project-stack` cuando el cambio
cruce preview con templates, layouts o build.
