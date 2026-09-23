/**
 * @file Storage keys for local storage and session management
 * Centralized location for all localStorage key constants
 */

/** App theme preference (light|dark), default is dark */
export const STORAGE_KEY_APP_THEME = "app-theme";

/** Template/email theme preference (light|dark), default is dark */
export const STORAGE_KEY_TEMPLATE_THEME = "template-theme";

/** Component Library: Last selected component ID */
export const STORAGE_KEY_SELECTED_COMPONENT = "selectedComponentId";

/** Preview: Currently selected viewport mode (desktop|mobile|custom) */
export const STORAGE_KEY_VIEWPORT_MODE = "preview-viewport-mode";

/** Preview: Custom viewport width when mode is "custom" */
export const STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH = "preview-viewport-custom-width";
