# Matriz de compatibilidad de email

Qué comprueba realmente EmailForge Toolkit, con qué evidencia y qué sigue sin
probarse. La matriz existe para no confundir **validación estática** (reglas que
leen el HTML compilado) con **prueba real** (un mensaje abierto en un cliente de
correo concreto).

Fuente de las reglas: `scripts/validators/email-rules/rules/`. Fuente del gate:
`scripts/build/build.js` y `scripts/build/build-selective.js`.

## Niveles de evidencia

| Nivel  | Significado                                                                                   | Cómo se produce                                                  |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **E0** | Sin evidencia propia. Afirmación heredada de la práctica del sector o del texto de una regla. | Ninguna ejecución lo comprueba.                                  |
| **E1** | Validación estática automatizada sobre `dist/*.html`.                                         | `bun run validate-email`, `bun run check-size`, `bun run build`. |
| **E2** | Render comprobado fuera de un cliente real (preview del dashboard, export PNG).               | `bun run dev` + `/preview`, `bun run export:screenshot`.         |
| **E3** | Prueba real: mensaje entregado y abierto en un cliente de correo identificado.                | Protocolo manual de la sección "Elevar evidencia a E3".          |

Regla de lectura: **E1 no implica E3**. Que una regla pase solo significa que el
HTML no contiene el patrón que esa regla busca.

## Estado actual del repositorio

| Ámbito                                         | Nivel máximo alcanzado | Evidencia                                                                   |
| ---------------------------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| Reglas de compatibilidad sobre `dist/`         | E1                     | `bun run validate-email` (13 reglas, gate en errores).                      |
| Tamaño frente al recorte de Gmail              | E1                     | `bun run check-size` (aviso a 100 KB, límite 102 KB).                       |
| Preservación de variables ESP `{{ }}`          | E1                     | Regla `esp-variables` + pruebas de `scripts/esp/`.                          |
| Render visual de templates                     | E2                     | Preview del dashboard y capturas de `screenshots/`.                         |
| Comportamiento en Gmail / Outlook / Apple Mail | **E0**                 | No hay ninguna ejecución registrada en un cliente real en este repositorio. |

## Reglas de validación estática (E1)

Las 13 reglas activas, en el orden en que corren. Los **errores detienen el
build**; warnings e info son informativos.

| Regla                   | Severidad      | Qué comprueba                                                                                                                                     | Qué **no** prueba                                                                                                    |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `img-dimensions`        | Error          | Toda `<img>` tiene `width` y `height` como atributos HTML.                                                                                        | Que la imagen se vea correctamente en Outlook.                                                                       |
| `img-alt`               | Warning        | Toda `<img>` tiene `alt` no vacío.                                                                                                                | Que el texto alternativo sea útil o que el cliente lo muestre.                                                       |
| `css-unsupported-props` | Error          | Ausencia en `<style>` de flex, grid, `position`, `float`, `gap`, `opacity`, `transform`, `animation`, `transition`, `calc()`, `var()`, `clamp()`. | Que el CSS restante se aplique igual en todos los clientes. Solo inspecciona `<style>`, no atributos `style` inline. |
| `doctype-present`       | Error          | El documento empieza con `<!doctype html>`.                                                                                                       | El modo de renderizado real del cliente.                                                                             |
| `meta-charset`          | Warning        | Existe `<meta charset="utf-8">`.                                                                                                                  | Que los acentos lleguen bien tras la codificación del ESP.                                                           |
| `link-targets`          | Warning        | Ningún `<a href>` es `#` ni vacío.                                                                                                                | Que la URL resuelva, ni el comportamiento de los envoltorios de tracking.                                            |
| `max-width-check`       | Warning        | El ancho máximo declarado es ≤ 700 px.                                                                                                            | El resultado real en la ventana de cada cliente móvil.                                                               |
| `color-scheme-meta`     | Info           | Existe `<meta name="color-scheme">` si hay dark mode.                                                                                             | Que el dark mode se respete: varios clientes invierten colores por su cuenta.                                        |
| `unsubscribe-link`      | Warning        | Hay link de baja (se omite si el frontmatter declara `emailType: transactional`).                                                                 | Cumplimiento legal; es una comprobación de presencia.                                                                |
| `no-js-in-email`        | Error          | No hay `<script>` en el HTML compilado.                                                                                                           | —                                                                                                                    |
| `nested-tables-depth`   | Info           | Anidamiento de tablas ≤ 4 niveles.                                                                                                                | Que Outlook no corrompa el layout con el anidamiento existente.                                                      |
| `css-class-vs-inline`   | Info           | Relación entre reglas en `<style>` y estilos inline.                                                                                              | Que Gmail conserve los estilos: informa el riesgo, no lo mide.                                                       |
| `esp-variables`         | Warning / Info | Toda `{{ var }}` del template fuente existe en `data.json`; reporta claves sin uso.                                                               | Que el ESP sustituya correctamente la variable en el envío.                                                          |

Comando y salida:

```bash
bun run validate-email   # informe por archivo de dist/ + resumen y exit code
bun run check-size       # tamaño por archivo frente al límite de Gmail
```

## Matriz de técnicas por cliente

Cada celda indica el **nivel de evidencia disponible en este repositorio**, no
una promesa de compatibilidad. Todas las columnas de clientes están en E0
porque no hay ninguna prueba de envío registrada.

| Técnica usada por los templates       | Gmail web | Gmail app | Outlook (Windows) | Outlook.com | Apple Mail (macOS/iOS) | Respaldo automatizado          |
| ------------------------------------- | --------- | --------- | ----------------- | ----------- | ---------------------- | ------------------------------ |
| Layout con tablas                     | E0        | E0        | E0                | E0          | E0                     | —                              |
| Estilos inline (Maizzle)              | E0        | E0        | E0                | E0          | E0                     | E1 `css-class-vs-inline`       |
| `<style>` en `<head>` + media queries | E0        | E0        | E0                | E0          | E0                     | E1 `css-class-vs-inline`       |
| Dark mode (`prefers-color-scheme`)    | E0        | E0        | E0                | E0          | E0                     | E1 `color-scheme-meta`         |
| `border-radius`                       | E0        | E0        | E0                | E0          | E0                     | —                              |
| Imágenes remotas con dimensiones      | E0        | E0        | E0                | E0          | E0                     | E1 `img-dimensions`, `img-alt` |
| Ancho máximo ≤ 700 px                 | E0        | E0        | E0                | E0          | E0                     | E1 `max-width-check`           |
| Ausencia de CSS moderno               | E0        | E0        | E0                | E0          | E0                     | E1 `css-unsupported-props`     |
| Tamaño bajo el recorte de Gmail       | E0        | E0        | E0                | E0          | E0                     | E1 `check-size`                |

La columna "Respaldo automatizado" es lo único que este repositorio puede
demostrar hoy sobre cada técnica.

### Afirmaciones heredadas (E0)

Estas afirmaciones aparecen en los mensajes de las reglas y en el README. Son
del sector, no resultados medidos aquí; se listan para poder auditarlas cuando
se ejecute el protocolo E3.

- Outlook (motor de Word) ignora flex, grid, `position`, `float`, `transform`,
  `calc()` y `var()`, y puede distorsionar imágenes sin `width`/`height`.
- Gmail elimina el `<style>` del `<head>` en ciertos contextos, por lo que un
  email con reglas en `<style>` y sin estilos inline pierde su formato.
- Gmail recorta el mensaje por encima de ~102 KB con "Ver mensaje completo".
- Ningún cliente de correo ejecuta JavaScript.
- El anidamiento excesivo de tablas puede corromper el layout en Outlook.

## Estado por template

Salida de `bun run validate-email` sobre `dist/` el 2026-09-18 (rama
`feature/mhb-18`, 6 templates):

| Template         | Errores | Warnings | Info | Detalle                                                         |
| ---------------- | ------- | -------- | ---- | --------------------------------------------------------------- |
| `welcome`        | 0       | 0        | 1    | `esp-variables`: clave `company` sin usar en el template.       |
| `password-reset` | 0       | 0        | 0    | —                                                               |
| `receipt`        | 0       | 0        | 0    | —                                                               |
| `newsletter`     | 0       | 0        | 0    | —                                                               |
| `example`        | 0       | 1        | 0    | `link-targets`: fixture con `href="#"` (excepción documentada). |
| `user-created`   | 0       | 1        | 0    | `link-targets`: fixture con `href="#"` (excepción documentada). |

`example` y `user-created` no son templates de producto; su warning es la
excepción de fixture registrada al cerrar MHB-21.

## Elevar evidencia a E3

Una prueba real no se registra sin estos cinco datos. Mientras falte alguno, la
celda sigue en E0.

1. **Envío**: `bun run cli` → opción `4` (Mailtrap), `5` (Mail-Tester vía Gmail
   SMTP) o `6` (bandeja real). Anotar la opción usada.
2. **Identificación del cliente**: nombre, versión y sistema operativo o
   navegador, más si es web, app o escritorio.
3. **Commit**: SHA del build enviado, para poder reproducir el HTML exacto.
4. **Captura**: imagen del mensaje abierto, en claro y en oscuro si el template
   declara dark mode.
5. **Veredicto por técnica**: qué fila de la matriz queda confirmada y qué se
   rompió, con la diferencia observada.

El resultado se registra actualizando la celda correspondiente a E3 con fecha y
enlace a la evidencia. Una prueba en un cliente no eleva a los demás.

## Fuera de alcance de este documento

- No sustituye a un servicio de pruebas multi-cliente (Litmus, Email on Acid);
  si se contrata uno, sus resultados se registran igual, como E3 con fuente.
- No documenta accesibilidad ni contraste del dashboard web: eso corresponde a
  `bun run lint:contrast` y `bun run a11y-check`.
- La creación de componentes está en [COMPONENT-GUIDE.md](COMPONENT-GUIDE.md).
