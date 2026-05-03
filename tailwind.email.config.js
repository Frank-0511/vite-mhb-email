// tailwind.email.config.js

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media", // Genera @media (prefers-color-scheme: dark) para compatibilidad total con clientes de email
  content: [
    "./src/emails/templates/**/*.html",
    "./src/emails/layouts/**/*.html",
    "./src/emails/partials/**/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Importante para emails
  },
};
