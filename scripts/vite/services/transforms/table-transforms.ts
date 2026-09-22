/**
 * @fileoverview Envoltura de fragmentos de tabla para renderizado seguro en componentes.
 */

/**
 * Detecta si el componente comienza con un fragmento de tabla (`<tr>`, `<td>`,
 * `<tbody>`, `<thead>` o `<tfoot>`) y lo envuelve en una tabla mínima.
 *
 * @param html Código HTML del componente.
 * @returns HTML envuelto en tabla si es fragmento, o el HTML original.
 */
export function wrapTableFragment(html: string): string {
  const trimmed = html.trimStart();
  const isTableFragment = /^<(tr|td|tbody|thead|tfoot)\b/i.test(trimmed);
  if (!isTableFragment) return html;
  return `<table class="w-full" cellpadding="0" cellspacing="0" role="none"><tbody>${html}</tbody></table>`;
}
