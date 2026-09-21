// @ts-check
/**
 * @fileoverview Plantillas HTML y scripts del cliente para el plugin Vite del dashboard.
 */

/**
 * Renderiza la tarjeta de un template real y activo con iframe y enlace a preview.
 *
 * @param {{ name: string, title: string, path: string }} template
 * @returns {string}
 */
export function renderTemplateCard({ name, title, path }) {
  return `
      <a
        href="/preview?template=${name}"
        class="template-card"
      >
        <!-- Preview Section -->
        <div class="template-card-preview">
          <div class="preview-wrapper">
            <div class="template-preview-skeleton" data-template-preview-skeleton="${name}" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <iframe data-preview-src="${path}" loading="lazy" title="Preview: ${title}" scrolling="no" tabindex="-1"></iframe>
          </div>
        </div>

        <!-- Content Section -->
        <div class="template-card-meta">
          <!-- Title -->
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-2">
              <span class="text-amber-500 dark:text-amber-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <span>${title}</span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">/templates/${name}/</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-slate-200 dark:border-slate-700"></div>

          <!-- Size Badge & Status -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Size</span>
            </div>
            <div class="template-size-badge-${name} flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                <span class="template-size-${name}">—</span>
              </span>
              <span class="template-status-${name} w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"></span>
            </div>
          </div>

          <!-- Gmail Limit Indicator -->
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Gmail limit: 102KB</span>
          </div>
        </div>
      </a>`;
}

/**
 * Renderiza el bloque de estado vacío cuando aún no hay templates.
 *
 * @returns {string}
 */
export function renderEmptyDashboardPlaceholder() {
  return `
        <div class="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">No hay templates creados aún.</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Crea tu primer template desde la terminal con <code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">bun run cli</code> o <code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">bun run generate:email &lt;nombre&gt;</code>.</p>
        </div>`;
}

/**
 * Genera el script del cliente para cargar y pintar los tamaños de templates.
 *
 * @returns {string}
 */
export function getTemplateSizesClientScript() {
  return `
      <script>
        async function loadTemplateSizes() {
          try {
            const response = await fetch('/api/template-sizes');
            const sizes = await response.json();
            for (const [name, size] of Object.entries(sizes)) {
              const sizeEl = document.querySelector('.template-size-' + name);
              const statusEl = document.querySelector('.template-status-' + name);
              if (sizeEl) {
                if (size === null) {
                  sizeEl.textContent = 'Not built';
                  if (statusEl) statusEl.className = 'template-status-' + name + ' w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600';
                } else {
                  const kb = parseFloat(size.kb);
                  let statusColor = 'bg-green-500 dark:bg-green-600';
                  let textColor = 'text-green-700 dark:text-green-400';

                  if (kb > 102) {
                    statusColor = 'bg-red-500 dark:bg-red-600';
                    textColor = 'text-red-700 dark:text-red-400';
                  } else if (kb > 100) {
                    statusColor = 'bg-yellow-500 dark:bg-yellow-600';
                    textColor = 'text-yellow-700 dark:text-yellow-400';
                  }

                  sizeEl.textContent = kb + ' KB';
                  sizeEl.className = 'template-size-' + name + ' ' + textColor + ' font-semibold';
                  if (statusEl) statusEl.className = 'template-status-' + name + ' w-2 h-2 rounded-full ' + statusColor;
                }
              }
            }
          } catch (err) {
            console.error('Error loading template sizes:', err);
          }
        }
        loadTemplateSizes();
      </script>`;
}
