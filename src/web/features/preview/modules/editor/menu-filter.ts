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
type MenuItem = {
  title?: string;
  text?: string;
  className?: string;
  value?: string;
  id?: string;
  icon?: { iconName?: string };
  items?: MenuItem[];
};

export function isTransformMenuItem(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const menuItem = item as MenuItem;
  const title = typeof menuItem.title === "string" ? menuItem.title.toLowerCase() : "";
  const text = typeof menuItem.text === "string" ? menuItem.text.toLowerCase() : "";
  const className = typeof menuItem.className === "string" ? menuItem.className.toLowerCase() : "";
  const value = typeof menuItem.value === "string" ? menuItem.value.toLowerCase() : "";
  const id = typeof menuItem.id === "string" ? menuItem.id.toLowerCase() : "";
  const iconName =
    menuItem.icon && typeof menuItem.icon.iconName === "string"
      ? menuItem.icon.iconName.toLowerCase()
      : "";

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
export function isTreeOrTableMenuItem(item: unknown): boolean {
  if (!item || typeof item !== "object") {
    return false;
  }

  const menuItem = item as MenuItem;
  const text = typeof menuItem.text === "string" ? menuItem.text.toLowerCase() : "";
  const value = typeof menuItem.value === "string" ? menuItem.value.toLowerCase() : "";
  const title = typeof menuItem.title === "string" ? menuItem.title.toLowerCase() : "";
  const id = typeof menuItem.id === "string" ? menuItem.id.toLowerCase() : "";

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
export function filterEditorMenuItems(items: MenuItem[] | null | undefined): MenuItem[] {
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
