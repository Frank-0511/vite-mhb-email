---
name: email-compatibility
description: Modificar templates, layouts, partials, CSS email, renderizado o validadores de EmailForge Toolkit. Usar cuando el cambio pueda alterar HTML final, variables ESP o compatibilidad de correo.
---

# Compatibilidad de email

- Priorizar clientes de correo sobre estética de navegador. Conservar doctype,
  charset, viewport, color scheme aplicable, variables ESP y salida en `dist/`.
- Preferir tablas, estilos inline y atributos HTML críticos. Evitar flex, grid,
  position, gap, scripts, runtime y CSS moderno sin compatibilidad demostrada.
- Usar dimensiones/alt en imágenes y URLs reales en templates de producto.
- Mantener `[[ page.* ]]` de Maizzle y `{{ }}` del ESP; no realizar reemplazos
  globales de delimitadores sin pruebas.
- Ejecutar `bun run validate-email` para templates, layouts, partials, CSS,
  validadores o pipeline; ejecutar también `bun run build` si cambia el HTML
  final.
- Emitir issues con archivo, severidad, regla, mensaje y contexto. Separar
  parsing, reglas y reporte si el validador crece.

Los warnings no prueban compatibilidad en Gmail, Outlook o Apple Mail; registrar
esa evidencia solo con el protocolo manual de la Fase C.
