/**
 * @file Editor menu filtering utilities for preview JSONEditor
 * Removes unsupported or unwanted items such as 'tree' and 'table' modes,
 * and the 'transform' feature icon/button.
 */

/**
 * Determines whether a menu item corresponds to the 'transform' feature.
 *
 * @param {any} item - Menu item candidate
 * @returns {boolean} True if the item is a transform action
 */
export function isTransformMenuItem(item) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
  const text = typeof item.text === "string" ? item.text.toLowerCase() : "";
  const className = typeof item.className === "string" ? item.className.toLowerCase() : "";
  const value = typeof item.value === "string" ? item.value.toLowerCase() : "";
  const id = typeof item.id === "string" ? item.id.toLowerCase() : "";
  const iconName =
    item.icon && typeof item.icon.iconName === "string" ? item.icon.iconName.toLowerCase() : "";

  return (
    title.includes("transform") ||
    text.includes("transform") ||
    className.includes("transform") ||
    value.includes("transform") ||
    id.includes("transform") ||
    iconName === "filter"
  );
}

/**
 * Determines whether a menu item corresponds to 'tree' or 'table' mode.
 *
 * @param {any} item - Menu item candidate
 * @returns {boolean} True if the item represents tree or table mode
 */
export function isTreeOrTableMenuItem(item) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const text = typeof item.text === "string" ? item.text.toLowerCase() : "";
  const value = typeof item.value === "string" ? item.value.toLowerCase() : "";
  const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
  const id = typeof item.id === "string" ? item.id.toLowerCase() : "";

  return (
    text === "tree" ||
    value === "tree" ||
    title === "tree" ||
    id === "tree" ||
    text === "table" ||
    value === "table" ||
    title === "table" ||
    id === "table"
  );
}

/**
 * Filters menu items recursively for JSONEditor.
 * - Removes 'tree' and 'table' options so editor stays exclusively in 'text' mode.
 * - Removes 'transform' action/icon.
 *
 * @param {Array<any>} items - Original menu items
 * @returns {Array<any>} Filtered menu items
 */
export function filterEditorMenuItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => !isTransformMenuItem(item) && !isTreeOrTableMenuItem(item))
    .map((item) => {
      if (item.items && Array.isArray(item.items)) {
        return {
          ...item,
          items: filterEditorMenuItems(item.items),
        };
      }
      return item;
    });
}
