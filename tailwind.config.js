/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Usar clase 'dark' para activar dark mode
  content: [
    "./src/web/index.html",
    "./src/web/preview.html",
    "./src/web/components-library.html",
    "./src/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      spacing: {
        4.5: "1.125rem", // 18px for checkbox size
      },
      maxHeight: {
        1000: "1000px", // For collapsible groups
      },
    },
  },
  plugins: [],
};
