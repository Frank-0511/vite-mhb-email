/**
 * @file Home page (EmailForge Toolkit) entry point
 * Handles template listing and grid initialization for index.html
 */

import { initLucideIcons } from "../../shared/utils/lucide-setup.ts";
import "../../shared/utils/theme-toggle-component.ts"; // Web Component auto-registers
import { initializeTemplateCardPreviews } from "./card-previews.ts";
import "./styles.css";

/**
 * Initialize Lucide icons and render Lucide elements on the page
 */
function initializeHome(): void {
  initLucideIcons();
  initializeTemplateCardPreviews();
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHome);
} else {
  initializeHome();
}
