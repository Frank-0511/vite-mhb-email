// Theme management module
export const theme = {
  init(themeToggleEl, themeIconLightEl, themeIconDarkEl) {
    this.toggle = themeToggleEl;
    this.iconLight = themeIconLightEl;
    this.iconDark = themeIconDarkEl;

    // Initialize theme on load
    if (localStorage.getItem("app-theme") === "dark" || !("app-theme" in localStorage)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    this.updateIcon();
    this.bindEvents();
  },

  updateIcon() {
    if (document.documentElement.classList.contains("dark")) {
      this.iconLight.classList.add("hidden");
      this.iconDark.classList.remove("hidden");
    } else {
      this.iconLight.classList.remove("hidden");
      this.iconDark.classList.add("hidden");
    }
  },

  bindEvents() {
    this.toggle.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("app-theme", isDark ? "dark" : "light");
      this.updateIcon();
    });
  },
};
