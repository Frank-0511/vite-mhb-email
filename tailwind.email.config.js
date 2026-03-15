// tailwind.email.config.js
console.log("TAILWIND CONFIG EMAIL LOADED");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/templates/**/*.html", "./src/layouts/**/*.html", "./src/partials/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Importante para emails
  },
};
