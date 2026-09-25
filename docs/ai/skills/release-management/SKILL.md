---
name: release-management
description: Gestionar congelamiento de alcance, checklist Go/No-Go, SemVer y publicaciones de release en EmailForge Toolkit. Usar para preparar releases posteriores o cambios de versión.
---

# Gestión de releases y control de versiones

## Mandato y prohibición de publicación autónoma

- Prohibición terminante de publicar, etiquetar (crear Git tags o releases en
  GitHub) o modificar versiones sin la aprobación explícita y formal del
  orquestador (chat principal / usuario).
- Toda release debe estar completamente sustentada en evidencias reproducibles,
  con la suite y los pipelines de CI en verde sobre `master`.

## Congelamiento de alcance (Scope Freeze)

- Al iniciar una tarea de release (p. ej. MHB-15), el alcance de la versión se
  congela de manera estricta.
- No se admiten nuevas features, mejoras ni refactors dentro del alcance congelado.
- Cualquier nuevo hallazgo o propuesta se registra como un nuevo ID en el
  backlog para la versión siguiente y no bloquea la release, salvo que rompa:
  1. El contrato de salida (`dist/*.html` o variables ESP `{{ }}`).
  2. La validación de correo (`bun run validate-email`).
  3. El build o la suite de pruebas (`bun run build`, `bun run test`).
     Solo las regresiones de estos tres aspectos bloquean y se resuelven dentro del
     alcance congelado.

## Checklist Go / No-Go

Antes de cualquier propuesta de tag o publicación, comprobar:

1. **Dependencias completadas:** todos los IDs del roadmap requeridos figuran
   como `Completada` en `STATUS.md` con revisión independiente firmada.
2. **CI y auditorías:** workflows de CI y auditorías limpios y en verde en `master`.
3. **Contrato de salida:** verificación de `dist/*.html` contra el baseline
   publicado (`v1.2.0`), confirmando preservación exacta de variables ESP `{{ }}`
   y hashes idénticos o con diferencias justificadas por template.
4. **Consistencia de artefactos:**
   - `package.json`: versión actualizada.
   - `CHANGELOG.md`: sección fechada, notas del alcance real y enlace al tag.
   - `README.md`: coherente con el estado funcional y comandos.
   - Notas de release: incluyen la sección «Contrato de salida para integradores».

## Criterios SemVer

- **Patch (v1.2.x):** correcciones internas sin cambios en contratos de salida,
  APIs ni CLI.
- **Minor (v1.x.0):** adición de funcionalidad retrocompatible, comandos o soporte
  aditivo (ej. soporte multi-package-manager) sin alterar contratos públicos.
- **Major (v2.0.0):** cambios que rompen la CLI pública, eliminan comandos de
  `package.json` o alteran de forma incompatible el formato de salida o sintaxis ESP.
- La versión final siempre se somete a confirmación del usuario antes de etiquetar.
