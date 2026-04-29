# Copilot Instructions

Guia obligatoria para agentes y Copilot en este repositorio.

Este archivo define reglas globales CRITICAS y delega detalles operativos a
skills en `docs/agent-skills/`.

---

## Mandato

Este proyecto es un sistema de desarrollo, preview, validacion y exportacion de
templates HTML de email basado en Bun, Vite, Maizzle y Handlebars.

Todo cambio debe preservar el flujo principal:

1. editar templates en `src/templates/*`;
2. previsualizar con Vite;
3. renderizar datos de preview con Handlebars;
4. compilar con Maizzle mediante el pipeline del proyecto;
5. validar compatibilidad de email;
6. producir HTML final plano en `dist/<template>.html`.

---

## ⚠️ Reglas Globales CRITICAS (SIEMPRE APLICAR)

Estas reglas tienen prioridad sobre cualquier sugerencia generada automaticamente por Copilot.

- - Usa Bun. Nunca usar `npm`, `npx`, `yarn` o `pnpm` bajo ninguna circunstancia.
- El build SIEMPRE es: `bun run build`
- No ejecutar `maizzle build` directamente
- Mantener intactas las variables ESP con `{{ }}` en el output final
- No introducir JS incompatible con email
- No romper el pipeline de Maizzle
- No escribir fuera del workspace
- No imprimir secretos ni credenciales
- No ocultar errores: deben ser explicitos, con mensajes claros y accionables

---

## Skills Repo-Locales

Para tareas especificas, consulta y aplica las reglas en:

- `docs/agent-skills/project-stack.md`
- `docs/agent-skills/quality-gates.md`
- `docs/agent-skills/refactor-type-safety.md`
- `docs/agent-skills/email-compatibility.md`
- `docs/agent-skills/workflow-git.md`

### Importante

Copilot puede no cargar automaticamente estos archivos.
Si no estan disponibles, aplica las mejores practicas segun:

- Bun + Vite + Maizzle
- HTML email compatibility (inline CSS, tablas, sin JS)
- Handlebars templating

---

## Reglas de Implementacion

- Todo JS en `scripts/`, `src/js/` y `scripts/vite-plugins/` debe incluir JSDoc suficiente
- ESLint debe cubrir cualquier codigo JS modificado
- No migrar todo a TypeScript sin aprobacion explicita
- No revertir cambios existentes que no hayas hecho
- Mantener consistencia con el pipeline actual

---

## Comandos Oficiales

```bash
bun install
bun run dev
bun run build
bun run lint
bun run validate-email
bun run cli
bun run format
bun run format:check
```

---

## Definicion de Terminado

Un cambio esta terminado solo si:

1. implementa el comportamiento solicitado;
2. mantiene compatibilidad del pipeline de email;
3. agrega JSDoc en contratos nuevos o modificados;
4. maneja errores relevantes;
5. ejecuta validaciones necesarias;
6. no introduce artefactos no solicitados;
7. resume archivos cambiados, comandos ejecutados y riesgos residuales.
