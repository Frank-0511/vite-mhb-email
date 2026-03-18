/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Usar clase 'dark' para activar dark mode
  content: [
    "./src/index.html",
    "./src/preview.html",
    "./src/components-library.html",
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
