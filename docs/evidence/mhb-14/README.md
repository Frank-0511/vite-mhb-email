# Evidencia MHB-14 — Chromium headless (no es prueba de cliente de correo)

Esta carpeta guarda la evidencia técnica que se puede producir sin clientes reales.
Los resultados de **Gmail, Outlook y Apple Mail** siguen `No verificado` en
`docs/guides/COMPATIBILITY-MATRIX.md` hasta la prueba manual, que se hará al final del plan.

## Qué se ejecutó

- Fecha: 2026-10-09. Commit del HTML: `0fb18ba` (rama `feature/mhb-14`).
- Entrada: los 6 archivos de `dist/` abiertos como `file://` en Chromium headless (Puppeteer).
- Viewports: escritorio 680 px y móvil 375 px. Capturas de página completa en `headless/`.
- Chequeos por archivo y viewport: `<title>` presente, doctype, desbordamiento horizontal,
  imágenes sin `alt`, errores de consola, peticiones fallidas y axe-core (WCAG 2A, 2AA, 2.1AA).
- Datos: solo los de ejemplo del template. No hay direcciones de correo reales en `dist/`.

## Resultados

| Archivo        | `<title>`                  | Desborda (680 / 375) | Imgs sin alt | Errores consola | Peticiones fallidas | axe: `color-contrast` (serious) |
| -------------- | -------------------------- | -------------------- | ------------ | --------------- | ------------------- | ------------------------------- |
| example        | `{{title}}` (variable ESP) | no / no              | 0            | 0               | 0                   | 1 nodo                          |
| newsletter     | Novedades de este mes      | no / no              | 0            | 0               | 0                   | 1 nodo                          |
| password-reset | Restablece tu contraseña   | no / no              | 0            | 0               | 0                   | 1 nodo                          |
| receipt        | Recibo de tu compra        | no / no              | 0            | 0               | 0                   | 3 nodos                         |
| user-created   | Tu cuenta ha sido creada   | no / no              | 0            | 0               | 0                   | 5 nodos                         |
| welcome        | Bienvenido a Mi Empresa    | no / no              | 0            | 0               | 0                   | 3 nodos                         |

Lectura:

- No hay desbordamiento horizontal en móvil ni escritorio, sin errores de consola ni peticiones fallidas.
- `{{title}}` en `example.html` es una variable ESP y se conserva, como exige el proyecto.
- **Hallazgo abierto:** `color-contrast` (WCAG 1.4.3) falla en los 6 emails. Hay que identificar los nodos
  y corregir los colores en el template. Eso cambia `dist/`, así que va en un ID aparte, con su baseline.
  Hasta entonces, A11Y-07 no puede marcarse como aprobado para estos templates.

## Qué no cubre

- Gmail, Outlook (motor de Word) y Apple Mail: no se renderizan en Chromium y su comportamiento
  real no está verificado.
- VoiceOver, navegación por teclado, zoom 200 % y modo oscuro del cliente (A11Y-08 a A11Y-12).
