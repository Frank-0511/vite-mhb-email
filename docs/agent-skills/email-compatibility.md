# Email Compatibility Skill

Usa esta skill cuando modifiques templates, layouts, partials, CSS de email,
validadores, rendering de preview o build final.

## Regla Principal

La compatibilidad de email manda sobre la estetica del codigo. El HTML final
debe funcionar en clientes reales, no solo en navegadores modernos.

## Output Final

El HTML final debe:

- conservar `<!doctype html>`;
- incluir meta charset y viewport;
- mantener meta tags de color scheme cuando aplique;
- preservar variables ESP `{{ }}`;
- usar estilos compatibles con email;
- salir como `dist/<template>.html`.

## CSS de Email

Evita en output final:

- `flex`;
- `grid`;
- `position`;
- `gap`;
- scripts;
- dependencias runtime;
- CSS moderno sin soporte razonable en clientes de email.

Prefiere:

- tablas para estructura;
- estilos inline;
- atributos HTML para dimensiones criticas;
- `width`, `height` y `alt` en imagenes;
- URLs reales en links de produccion.

## Templates y Delimitadores

- `[[ page.* ]]` pertenece a Maizzle.
- `{{ * }}` pertenece al ESP y debe sobrevivir al build.
- No introduzcas transformaciones globales sin pruebas manuales o automatizadas.
- Si cambias delimitadores, revisa preview y build final.

## Validacion

Ejecuta `bun run validate-email` cuando cambies:

- layouts;
- partials;
- templates;
- CSS de email;
- validadores;
- build pipeline que afecte output HTML.

Ejecuta `bun run build` cuando el cambio pueda afectar el output final.

## Validadores

Los validadores deben producir issues accionables:

- archivo;
- severidad;
- regla;
- mensaje;
- contexto.

Mantiene reglas nombradas y faciles de extender. Si el archivo crece demasiado,
separa parsing, reglas y rendering del reporte.
