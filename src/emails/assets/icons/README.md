# Iconos PNG para Emails

Colección de iconos PNG optimizados a doble densidad (@2x) con fondo transparente para clientes de correo electrónico (Gmail, Outlook de escritorio, Apple Mail, etc.).

## Origen y Licencia

- **Librería base:** [Lucide Icons](https://lucide.dev/) (`lucide@1.47.0`).
- **Licencia:** [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE) (compatible con uso comercial y redistribución).
- **Decisión D3:** El saludo de bienvenida (`welcome`) utiliza el icono Lucide `hand` en sustitución de `mdi:hand-wave`, unificando todos los iconos bajo el mismo paquete y evitando licencias heterogéneas.

## Inventario de Iconos

| Archivo                            | Icono Lucide     | Color HEX | Tamaño PNG (@2x) | Tamaño en HTML | Uso en plantillas                                      |
| :--------------------------------- | :--------------- | :-------- | :--------------: | :------------: | :----------------------------------------------------- |
| `lucide-rocket-fbbf24.png`         | `rocket`         | `#fbbf24` |     48×48 px     |    24×24 px    | `src/emails/layouts/main.html` (cabecera dark-only)    |
| `lucide-rocket-e5e7eb.png`         | `rocket`         | `#e5e7eb` |     48×48 px     |    24×24 px    | `src/emails/layouts/main.html` (cabecera auto/light)   |
| `lucide-party-popper-fbbf24.png`   | `party-popper`   | `#fbbf24` |     96×96 px     |    48×48 px    | `src/emails/templates/user-created/` (ilustración)     |
| `lucide-triangle-alert-ef4444.png` | `triangle-alert` | `#ef4444` |     32×32 px     |    16×16 px    | `src/emails/templates/user-created/` (aviso seguridad) |
| `lucide-hand-121212.png`           | `hand`           | `#121212` |     48×48 px     |    24×24 px    | `src/emails/templates/welcome/` (saludo modo claro)    |
| `lucide-hand-fbbf24.png`           | `hand`           | `#fbbf24` |     48×48 px     |    24×24 px    | `src/emails/templates/welcome/` (saludo modo oscuro)   |
| `lucide-circle-check-121212.png`   | `circle-check`   | `#121212` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 1 claro)      |
| `lucide-circle-check-10b981.png`   | `circle-check`   | `#10b981` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 1 oscuro)     |
| `lucide-bell-121212.png`           | `bell`           | `#121212` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 2 claro)      |
| `lucide-bell-f59e0b.png`           | `bell`           | `#f59e0b` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 2 oscuro)     |
| `lucide-rocket-121212.png`         | `rocket`         | `#121212` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 3 claro)      |
| `lucide-rocket-3b82f6.png`         | `rocket`         | `#3b82f6` |     40×40 px     |    20×20 px    | `src/emails/templates/welcome/` (feature 3 oscuro)     |

## Hosting y Entrega

Los iconos se sirven a través del CDN público jsDelivr directamente desde el repositorio en GitHub:

```text
https://cdn.jsdelivr.net/gh/Frank-0511/vite-mhb-email@master/src/emails/assets/icons/<archivo>.png
```

El atom `<x-email-icon />` en `src/emails/partials/atoms/email-icon/index.html` encapsula esta URL base para todos los templates de email.

## Cómo Regenerar y Añadir Nuevos Iconos

Los iconos se renderizan a partir de los nodos SVG de la librería `lucide` mediante `@resvg/resvg-js` con fondo transparente y dimensiones dobles (@2x) para alta densidad:

1. Ejecutar el comando generador:

   ```bash
   <pm> run generate:icons --icon <nombre-lucide> --color <hex-sin-#> --size <px-en-html> [--suffix <vN>]
   ```

   _Ejemplo:_

   ```bash
   <pm> run generate:icons --icon rocket --color fbbf24 --size 24
   ```

   Genera `src/emails/assets/icons/lucide-rocket-fbbf24.png` con tamaño de 48×48 px.

2. **Inmutabilidad:** Los iconos PNG existentes son estrictamente inmutables para prevenir inconsistencias provocadas por el almacenamiento en caché de jsDelivr y clientes de correo. Si el diseño o color de un icono cambia, no se debe sobrescribir el archivo: genere uno nuevo agregando un sufijo de versión con `--suffix` (ejemplo: `<pm> run generate:icons --icon rocket --color fbbf24 --size 24 --suffix v2` genera `src/emails/assets/icons/lucide-rocket-fbbf24-v2.png`) y actualice la referencia en la plantilla correspondiente.

3. **Plan B de purga de caché:** En caso excepcional de requerir invalidación de caché de un icono existente en el CDN, utilizar el endpoint de purga de jsDelivr:

   ```text
   https://purge.jsdelivr.net/gh/Frank-0511/vite-mhb-email@master/src/emails/assets/icons/<archivo>.png
   ```
