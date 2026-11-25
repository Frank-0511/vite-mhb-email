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

## Qué cuenta como evidencia de compatibilidad

- La validación estática (`validate-email`, `check-size`, `build`) solo prueba
  que el HTML no contiene los patrones que cada regla busca. Nunca prueba que
  un cliente de correo lo muestre bien.
- El render del preview o de una captura tampoco es un cliente real.
- Solo cuenta como compatibilidad comprobada un mensaje entregado y abierto en
  un cliente identificado (Gmail, Outlook, Apple Mail u otro), con fecha,
  criterio y resultado. Esa prueba la ejecuta una persona en el dispositivo.
- Registrar el resultado en `docs/guides/COMPATIBILITY-MATRIX.md`. Lo que no se
  ejecutó queda como «No verificado»; no se afirma compatibilidad por analogía
  ni se certifica compatibilidad universal.
- No incluir datos sensibles (direcciones reales, claves, tokens) en la
  evidencia.
