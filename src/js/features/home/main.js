/**
 * @file Home page (Email Factory Dashboard) entry point
 * Handles template listing and grid initialization for index.html
 */

import { initLucideIcons } from "../../shared/lucide-setup.js";
import "../../shared/theme-toggle-component.js"; // Web Component auto-registers

/**
 * Initialize Lucide icons and render Lucide elements on the page
 */
function initializeHome() {
  initLucideIcons();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHome);
} else {
  initializeHome();
}
