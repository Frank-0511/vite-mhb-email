/**
 * @file Theme Toggle Web Component
 * Reusable web component for app theme toggling (light/dark mode)
 * Handles localStorage persistence and dispatches theme-changed events
 */

/**
 * @class ThemeToggle
 * Web component for theme toggling functionality
 * Usage: <theme-toggle></theme-toggle>
 */
export class ThemeToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateIcon();
    // Listen for theme changes from other instances
    window.addEventListener("theme-changed", () => this.updateIcon());
  }

  disconnectedCallback() {
    window.removeEventListener("theme-changed", () => this.updateIcon());
  }

  /**
   * Render the component UI in shadow DOM
   */
  render() {
    const template = document.createElement("template");
    template.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.375rem;
          border: 1px solid;
          border-color: #cbd5e1;
          background-color: #f1f5f9;
          cursor: pointer;
          transition: all 150ms ease;
          padding: 0;
          margin: 0;
          font-family: inherit;
        }

        :host(.dark) button {
          border-color: #475569;
          background-color: #334155;
        }

        button:hover {
          background-color: #e2e8f0;
          border-color: #94a3b8;
        }

        :host(.dark) button:hover {
          background-color: #1e293b;
          border-color: #64748b;
        }

        svg {
          width: 1.25rem;
          height: 1.25rem;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        #light-wrapper svg {
          color: #475569; /* slate-600 */
        }

        #dark-wrapper svg {
          color: #fbbf24; /* amber-400 */
        }

        span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        #dark-wrapper {
          display: none;
        }
      </style>

      <button aria-label="Toggle theme">
        <span id="light-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </span>
        <span id="dark-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </span>
      </button>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.button = this.shadowRoot.querySelector("button");
    this.lightWrapper = this.shadowRoot.getElementById("light-wrapper");
    this.darkWrapper = this.shadowRoot.getElementById("dark-wrapper");
  }

  /**
   * Setup event listeners for theme toggling
   */
  setupEventListeners() {
    this.button.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("app-theme", isDark ? "dark" : "light");

      this.updateIcon();
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: { isDark } }));
    });
  }

  /**
   * Update icon visibility based on current theme
   */
  updateIcon() {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      this.lightWrapper.style.display = "none";
      this.darkWrapper.style.display = "inline-flex";
      this.classList.add("dark");
    } else {
      this.lightWrapper.style.display = "inline-flex";
      this.darkWrapper.style.display = "none";
      this.classList.remove("dark");
    }
  }
}

// Register the web component
customElements.define("theme-toggle", ThemeToggle);
