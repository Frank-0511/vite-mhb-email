# Checklist de accesibilidad de email

Checklist reproducible para auditar accesibilidad en los templates de email compilados
en `dist/` y en clientes de correo reales.

## Criterios de accesibilidad

| ID      | Criterio                                                                 | Referencia WCAG            | Método                                                      | Tipo           |
| :------ | :----------------------------------------------------------------------- | :------------------------- | :---------------------------------------------------------- | :------------- |
| A11Y-01 | Idioma declarado en `html` (`lang="es"`)                                 | WCAG 3.1.1 (A)             | Inspección estática del atributo `lang` en `dist/*.html`    | Estático       |
| A11Y-02 | Etiqueta `title` descriptiva y no vacía                                  | WCAG 2.4.2 (A)             | Inspección estática de `<title>` en `<head>`                | Estático       |
| A11Y-03 | Tablas de layout con `role="none"` o `presentation`                      | WCAG 1.3.1 (A)             | Búsqueda de `<table>` sin `role="none"` / `presentation`    | Estático       |
| A11Y-04 | Jerarquía de encabezados coherente (un `h1`, sin saltos)                 | WCAG 1.3.1 (A)             | Inspección de etiquetas `<h1>`–`<h6>`                       | Estático       |
| A11Y-05 | Atributo `alt` en imágenes (descriptivo o vacío si decorativo)           | WCAG 1.1.1 (A)             | Verificación de atributo `alt` y comprobación con lector    | Estático       |
| A11Y-06 | Textos de enlaces descriptivos y comprensibles fuera de contexto         | WCAG 2.4.4 (A)             | Lectura de rotor de enlaces con lector de pantalla          | Manual-lector  |
| A11Y-07 | Contraste de texto suficiente (≥ 4.5:1 texto normal, ≥ 3:1 texto grande) | WCAG 1.4.3 (AA)            | Cálculo o muestreo cromático en fondos claro y oscuro       | Manual-visual  |
| A11Y-08 | Orden de lectura y navegación lógico con lector de pantalla              | WCAG 1.3.2 (A)             | Recorrido lineal con VoiceOver (macOS / iOS)                | Manual-lector  |
| A11Y-09 | Navegación por teclado completa (Tab, orden secuencial, foco visible)    | WCAG 2.1.1 (A), 2.4.7 (AA) | Navegación con Tab/Shift+Tab y Enter en cliente web         | Manual-teclado |
| A11Y-10 | Legibilidad y estabilidad visual con zoom del 200 %                      | WCAG 1.4.4 (AA)            | Ampliación a 200 % en cliente desktop/web sin superposición | Manual-visual  |
| A11Y-11 | Comprensión del mensaje con descarga de imágenes bloqueada               | WCAG 1.1.1 (A)             | Desactivación de imágenes remotas en el cliente             | Manual-visual  |
| A11Y-12 | Modo oscuro del cliente sin inversión destructiva ni texto ilegible      | WCAG 1.4.3 (AA)            | Inspección en cliente con dark mode activo                  | Manual-visual  |

## Resultados de validación estática (2026-10-09)

Evaluación automatizada sobre los 4 templates de producto en `dist/` tras el commit `0fb18ba`.

| Criterio | `welcome`                               | `password-reset`                        | `receipt`                               | `newsletter`                            | Estado general           |
| :------- | :-------------------------------------- | :-------------------------------------- | :-------------------------------------- | :-------------------------------------- | :----------------------- |
| A11Y-01  | Aprobado (`lang="es"`)                  | Aprobado (`lang="es"`)                  | Aprobado (`lang="es"`)                  | Aprobado (`lang="es"`)                  | Conforme                 |
| A11Y-02  | Aprobado ("Bienvenido a Mi Empresa")    | Aprobado ("Restablece tu contraseña")   | Aprobado ("Recibo de tu compra")        | Aprobado ("Novedades de este mes")      | Conforme (corregido F1b) |
| A11Y-03  | Aprobado (4/4 tablas con `role="none"`) | Aprobado (5/5 tablas con `role="none"`) | Aprobado (6/6 tablas con `role="none"`) | Aprobado (5/5 tablas con `role="none"`) | Conforme                 |
| A11Y-04  | Observación (2 `h1` presentes)          | Aprobado (1 `h1`)                       | Aprobado (1 `h1`)                       | Aprobado (1 `h1`, 1 `h2`)               | Hallazgo en `welcome`    |
| A11Y-05  | Aprobado (9/9 con `alt`)                | Aprobado (1/1 con `alt`)                | Aprobado (1/1 con `alt`)                | Aprobado (1/1 con `alt`)                | Conforme en estático     |

> **Nota sobre A11Y-04 en `welcome`:** El template presenta dos encabezados de nivel 1 (`¡Hola, {{ first_name }}!` y `Bienvenido a Mi Empresa`). Se registra como hallazgo documental de cara a la Fase D para unificar el saludo bajo una estructura semántica única sin alterar el baseline actual de `dist/`.

## Procedimiento de verificación manual

### 1. Lector de pantalla (VoiceOver)

- **macOS:**
  1. Abrir Apple Mail o el cliente web en Safari.
  2. Activar VoiceOver con `Cmd + F5`.
  3. Navegar linealmente usando `Control + Option + Flecha Derecha`.
  4. Abrir el rotor de VoiceOver con `Control + Option + U`, cambiar a «Enlaces» y verificar que cada enlace sea comprensible fuera de contexto.
  5. Verificar que las tablas con `role="none"` no anuncien recuento de filas/columnas como tabla de datos.
- **iOS:**
  1. Activar VoiceOver en `Ajustes > Accesibilidad > VoiceOver`.
  2. Deslizar hacia la derecha para recorrer secuencialmente el contenido del email.
  3. Comprobar que no existan trampas de foco ni saltos de contenido ilógicos.

### 2. Navegación por teclado (Cliente web)

1. Abrir el cliente de correo en el navegador (p. ej. Gmail Web o Outlook.com).
2. Enfocar el cuerpo del mensaje y utilizar la tecla `Tab` para avanzar entre elementos interactivos (`<a>`, botones).
3. Usar `Shift + Tab` para retroceder.
4. Confirmar que el anillo de foco (`outline`) sea claramente visible sobre cada elemento.
5. Presionar `Enter` para activar el enlace enfocado.

## Límites

1. **Alteración del DOM por el cliente:** Clientes como Gmail y Outlook prefijan clases CSS, stripan tags semánticos o envuelven enlaces con redirects de tracking que pueden alterar la accesibilidad final.
2. **Validez puntual:** Un resultado manual es válido exclusivamente para la combinación exacta de cliente, versión de sistema operativo y fecha de ejecución reportada.
3. **No certificación universal:** El cumplimiento de este checklist no certifica compatibilidad universal en clientes legados o configuraciones de accesibilidad no auditadas.
