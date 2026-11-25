---
name: release-management
description: Gestionar congelamiento de alcance, checklist Go/No-Go, SemVer y publicaciones de release en EmailForge Toolkit. Usar para preparar releases posteriores o cambios de versión.
---

# Gestión de releases y control de versiones

## Mandato y prohibición de publicación autónoma

- Prohibición terminante de publicar, etiquetar (crear Git tags o releases en
  GitHub) o modificar versiones sin la aprobación explícita y formal del
  orquestador (chat principal / usuario).
- Toda release debe estar completamente sustentada en controles reproducibles,
  con la suite y los pipelines de CI en verde sobre `master`.

## Congelamiento de alcance (Scope Freeze)

- Al iniciar una tarea de release, el alcance de la versión se congela de
  manera estricta. La lista de tareas incluidas se registra en la sección de la
  release de `CHANGELOG.md`.
- No se admiten nuevas features, mejoras ni refactors dentro del alcance congelado.
- Cualquier nuevo hallazgo o propuesta se registra como un nuevo ID en
  `docs/implementation/PLAN.md` para la versión siguiente y no bloquea la release, salvo que rompa:
  1. El contrato de salida (`dist/*.html` o variables ESP `{{ }}`).
  2. La validación de correo (`bun run validate-email`).
  3. El build o la suite de pruebas (`bun run build`, `bun run test`).
     Solo las regresiones de estos tres aspectos bloquean y se resuelven dentro del
     alcance congelado.

## Checklist Go / No-Go

Antes de cualquier propuesta de tag o publicación, comprobar:

1. **Alcance completado:** todos los IDs del roadmap requeridos figuran como
   `Completada` en `docs/implementation/STATUS.md` con revisión independiente
   firmada. El alcance se registró al congelarlo y se documenta en la sección
   de la release de `CHANGELOG.md`.
2. **CI y auditorías:** workflows de CI y auditorías limpios y en verde en `master`.
3. **Contrato de salida:** verificación de `dist/*.html` contra la release
   publicada anterior (la release anterior a la que se propone), confirmando preservación exacta de variables ESP `{{ }}`
   y hashes idénticos o con diferencias justificadas por template.
4. **Consistencia de artefactos:**
   - `package.json`: versión actualizada.
   - `CHANGELOG.md`: sección fechada, notas del alcance real y enlace al tag.
   - `README.md`: coherente con el estado funcional y comandos.
   - Notas de release: incluyen la sección «Contrato de salida para integradores».

## Criterios SemVer

- **Patch (vX.Y.Z):** correcciones internas sin cambios en contratos de salida,
  APIs ni CLI.
- **Minor (vX.Y.0):** adición de funcionalidad retrocompatible, comandos o soporte
  aditivo (p. ej. un comando o una opción nueva) sin alterar contratos públicos.
- **Major (vX.0.0):** cambios que rompen la CLI pública, eliminan comandos de
  `package.json` o alteran de forma incompatible el formato de salida o sintaxis ESP.
- La versión final siempre se somete a confirmación del usuario antes de etiquetar.
