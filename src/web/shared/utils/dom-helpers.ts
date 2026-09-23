/**
 * @file DOM helpers for required element queries and validation
 * Provides helpers to safely query and validate required DOM elements
 */

/**
 * Query a required DOM element by ID.
 * Throws an actionable error if the element is not found.
 *
 * @param {string} elementId - The ID of the element to query
 * @param {string} context - Descriptive context for the error message (e.g., "Preview Module")
 * @returns {HTMLElement} The queried element
 * @throws {Error} If the element is not found
 */
export function queryRequired<T extends HTMLElement = HTMLElement>(
  elementId: string,
  context = "Application",
): T {
  const el = document.getElementById(elementId);
  if (!el) {
    const msg = `[${context}] Required DOM element not found: #${elementId}. Make sure the HTML structure is correct.`;
    console.error(msg);
    throw new Error(msg);
  }
  return el as T;
}

/**
 * Query a required DOM element by selector.
 * Throws an actionable error if the element is not found.
 *
 * @param {string} selector - The CSS selector of the element to query
 * @param {string} context - Descriptive context for the error message
 * @returns {HTMLElement} The queried element
 * @throws {Error} If the element is not found
 */
export function querySelectorRequired<T extends Element = HTMLElement>(
  selector: string,
  context = "Application",
): T {
  const el = document.querySelector(selector);
  if (!el) {
    const msg = `[${context}] Required DOM element not found: ${selector}. Make sure the HTML structure is correct.`;
    console.error(msg);
    throw new Error(msg);
  }
  return el as T;
}

/**
 * Safely query a DOM element by ID without throwing.
 *
 * @param {string} elementId - The ID of the element to query
 * @returns {HTMLElement | null} The element or null if not found
 */
export function querySafe<T extends HTMLElement = HTMLElement>(elementId: string): T | null {
  return document.getElementById(elementId) as T | null;
}

/**
 * Safely query a DOM element by selector without throwing.
 *
 * @param {string} selector - The CSS selector of the element to query
 * @returns {HTMLElement | null} The element or null if not found
 */
export function querySelectorSafe<T extends Element = HTMLElement>(selector: string): T | null {
  return document.querySelector(selector) as T | null;
}
