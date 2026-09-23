/**
 * @file HTTP and utility helpers
 * Provides debounce and common fetch patterns
 */

/**
 * Debounce function execution to avoid rapid calls.
 * Useful for render, search, and validation operations triggered by user input.
 *
 * @param {Function} fn - Function to debounce
 * @param {number} delayMs - Delay in milliseconds before executing
 * @returns {Function} Debounced function that clears previous timers
 */
export function debounce<Arguments extends unknown[]>(
  fn: (this: unknown, ...args: Arguments) => void,
  delayMs = 300,
): (...args: Arguments) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function debounced(this: unknown, ...args: Arguments): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delayMs);
  };
}

/**
 * Execute a callback after user input stops.
 * Returns a function that resets the timer on each call.
 *
 * @param {Function} callback - Function to run after delay
 * @param {number} delayMs - Delay after last input (default 300ms)
 * @returns {() => void} Function to call on each input event
 */
export function createDebounceTimer(callback: () => void, delayMs = 300): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function reset(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delayMs);
  };
}

/**
 * Make a JSON fetch request with error handling.
 *
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If fetch fails or response is not JSON
 */
export async function fetchJSON<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);
  if (
    response.ok === false ||
    (typeof response.status === "number" && (response.status < 200 || response.status >= 300))
  ) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/**
 * Make a text fetch request with error handling.
 *
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise<string>} Response text
 * @throws {Error} If fetch fails
 */
export async function fetchText(url: string, options: RequestInit = {}): Promise<string> {
  const response = await fetch(url, options);
  if (
    response.ok === false ||
    (typeof response.status === "number" && (response.status < 200 || response.status >= 300))
  ) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Post JSON data to a URL and get JSON response.
 *
 * @param {string} url - Request URL
 * @param {Object} data - Data to send as JSON
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If fetch or parsing fails
 */
export function postJSON<T = unknown>(url: string, data: unknown): Promise<T> {
  return fetchJSON<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Post JSON data to a URL and get plain text (HTML) response.
 *
 * @param {string} url - Request URL
 * @param {unknown} data - Data to send as JSON
 * @returns {Promise<string>} Plain text response
 * @throws {Error} If fetch fails or response status is not OK
 */
export function postText(url: string, data: unknown): Promise<string> {
  return fetchText(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Execute a fetch request directly returning the Response without status checks.
 * Allows custom header inspection and status handling while centralizing network access.
 *
 * @param {string | URL | Request} input - Request URL or Request object
 * @param {RequestInit} [init] - Fetch options
 * @returns {Promise<Response>}
 */
export function sendRequest(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}
