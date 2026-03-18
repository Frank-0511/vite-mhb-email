// Form renderer module
export const formRenderer = {
  container: null,
  placeholder: null,
  onInputChange: null,
  onVariantChange: null,

  init(containerEl, placeholderEl, onInputChange, onVariantChange) {
    this.container = containerEl;
    this.placeholder = placeholderEl;
    this.onInputChange = onInputChange;
    this.onVariantChange = onVariantChange;
  },

  render(component, formData) {
    this.container.innerHTML = "";
    this.placeholder.style.display = "none";

    if (Object.keys(component.props || {}).length > 0) {
      const title = document.createElement("div");
      title.className =
        "text-base font-bold mt-8 mb-4 text-slate-800 dark:text-slate-200 tracking-wide";
      title.textContent = "Props";
      this.container.appendChild(title);
    }

    for (const [key, prop] of Object.entries(component.props || {})) {
      const group = document.createElement("div");
      group.className = "mb-8";

      const label = document.createElement("label");
      label.className =
        "block font-semibold mb-3 select-none text-slate-800 dark:text-slate-200 text-sm tracking-wide";
      label.textContent = prop.label || key;

      let input;

      if (prop.type === "boolean") {
        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center gap-3";

        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.className = "toggle-switch-input";
        toggle.checked = formData[key] || false;
        toggle.addEventListener("change", (e) => {
          formData[key] = e.target.checked;
          this.onInputChange(key, e.target.checked);
        });

        const labelText = document.createElement("span");
        labelText.className = "toggle-switch-label";
        labelText.textContent = prop.label || key;

        wrapper.appendChild(toggle);
        wrapper.appendChild(labelText);
        group.appendChild(wrapper);
        this.container.appendChild(group);
        continue;
      } else if (prop.type === "select") {
        input = document.createElement("select");
        input.className =
          "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-inherit bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10";
        for (const option of prop.options || []) {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label || option.value;
          input.appendChild(opt);
        }
        input.value = formData[key] || prop.default;

        if (key === "variant") {
          input.addEventListener("change", (e) => {
            formData[key] = e.target.value;
            this.onVariantChange(e.target.value);
          });
        }
      } else if (prop.type === "textarea") {
        input = document.createElement("textarea");
        input.className =
          "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-inherit bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10 resize-vertical min-h-24";
        input.value = formData[key] || prop.default;
      } else if (prop.type === "number") {
        input = document.createElement("input");
        input.type = "number";
        input.className =
          "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-inherit bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10";
        input.value = formData[key] || prop.default;
      } else if (prop.type === "date") {
        input = document.createElement("input");
        input.type = "date";
        input.className =
          "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-inherit bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10";
        input.value = formData[key] || prop.default;
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.className =
          "w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded text-sm font-inherit bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10";
        input.placeholder = prop.default;
        input.value = formData[key] || prop.default;
      }

      input.addEventListener("input", (e) => {
        const value = prop.type === "number" ? parseFloat(e.target.value) : e.target.value;
        formData[key] = value;
        this.onInputChange(key, value);
      });

      if (prop.type === "select" && key !== "variant") {
        input.addEventListener("change", (e) => {
          formData[key] = e.target.value;
          this.onInputChange(key, e.target.value);
        });
      }

      group.appendChild(label);
      group.appendChild(input);
      this.container.appendChild(group);
    }
  },
};
