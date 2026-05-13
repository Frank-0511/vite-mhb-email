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
    extend: {
      colors: {
        main: {
          50: "#EEEEEE",
          200: "#D0D0D0",
        },
        neutral: {
          800: "#2A2A2A",
        },
        secondary: {
          200: "#99E1FF",
          500: "#00B2FF",
        },
      },
      screens: {
        sm: "600px",
      },
      fontSize: {
        xxs: ["10px", { lineHeight: "14px" }],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
