/** @type {import('tailwindcss').Config} */
console.log("Using tailwind.config.js for web");
export default {
  darkMode: "media", // Usar clase 'dark' para activar dark mode
  content: [
    "./src/index.html",
    "./src/preview.html",
    "./src/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
