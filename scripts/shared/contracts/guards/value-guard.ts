/**
 * @fileoverview Fábrica genérica de type guards para objetos `as const`.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

/**
 * Crea una función de comprobación de tipo (type guard) para los valores de un objeto `as const`.
 *
 * @param valuesObj Objeto cuyos valores definen la unión válida.
 * @returns Guard que valida si un valor desconocido pertenece a los valores del objeto.
 */
export function createValueGuard<const T extends Record<string, string>>(
  valuesObj: T,
): (value: unknown) => value is T[keyof T] {
  const allowedValues: readonly string[] = Object.values(valuesObj);
  return (value: unknown): value is T[keyof T] =>
    typeof value === "string" && allowedValues.includes(value);
}
