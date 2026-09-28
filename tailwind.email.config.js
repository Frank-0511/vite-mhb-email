// tailwind.email.config.js

import defaultTheme from "tailwindcss/defaultTheme.js";
import emailPreset from "tailwindcss-preset-email";

/**
 * Preset de email: emite HEX en lugar de la sintaxis CSS Color 4
 * (rgb(r g b / a)) que Outlook de escritorio y otros clientes no soportan.
 * El theme de abajo neutraliza las diferencias de diseño que introduce el
 * preset (screens desktop-first, maxWidth.2xl, fontSize sin lineHeight,
 * fontFamily y letterSpacing en em) para no alterar el diseño existente.
 */
/** @type {import('tailwindcss').Config} */
export default {
  presets: [emailPreset],
  darkMode: "media",
  important: true,
  content: [
    "./src/emails/templates/**/*.html",
    "./src/emails/layouts/**/*.html",
    "./src/emails/partials/**/*.html",
  ],
  theme: {
    // Reemplaza los screens desktop-first del preset (sm:{max:600px}) por
    // los mobile-first por defecto de Tailwind, con `sm` ajustado a 600px.
    screens: { ...defaultTheme.screens, sm: "600px" },
    extend: {
      colors: {
        main: {
          50: "#EEEEEE",
          200: "#D0D0D0",
        },
        neutral: {
          800: "#2A2A2A",
          900: "#121212",
        },
        secondary: {
          200: "#99E1FF",
          500: "#00B2FF",
        },
      },
      // El preset define maxWidth.2xl = 336px; el diseño actual usa el
      // valor por defecto de Tailwind (672px) para el contenedor principal.
      maxWidth: { "2xl": "672px" },
      fontFamily: {
        sans: defaultTheme.fontFamily.sans,
        serif: defaultTheme.fontFamily.serif,
        mono: defaultTheme.fontFamily.mono,
      },
      // El preset define fontSize sin lineHeight; se preserva el interlineado
      // implícito actual convirtiendo cada par rem/rem a px/px.
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "1" }],
        xxs: ["10px", { lineHeight: "14px" }],
      },
      // `tracking-*` en em no es fiable en todos los clientes; se fija en px
      // según el text-* con el que se usa hoy en los templates (ver
      // src/emails/**: tracking-tight solo con text-2xl, tracking-wider y
      // tracking-widest solo con text-xs, salvo una excepción resuelta con
      // un valor arbitrario en el propio elemento).
      letterSpacing: {
        tight: "-0.6px",
        wider: "0.6px",
        widest: "1.2px",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
