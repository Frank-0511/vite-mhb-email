/**
 * Theme initialization script
 * Prevents FOUC (Flash of Unstyled Content) by applying theme immediately
 * This script runs before page render to avoid theme flicker
 */

// Check if dark mode is enabled in localStorage
// Default to dark mode if not set
if (localStorage.getItem("app-theme") === "dark" || !("app-theme" in localStorage)) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}
