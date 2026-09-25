/**
 * @fileoverview Eliminación de bloques script props en parciales de email.
 */

/**
 * Elimina el bloque `<script props>...</script>` del partial, si existe.
 *
 * @param html Código HTML del componente.
 * @returns HTML sin el bloque script props.
 */
export function stripPropsScript(html: string): string {
  let previous: string;
  let current = html;
  do {
    previous = current;
    current = current.replace(/<script\s+props[^>]*>[\s\S]*?<\/script>/gi, "");
  } while (current !== previous);
  return current;
}
