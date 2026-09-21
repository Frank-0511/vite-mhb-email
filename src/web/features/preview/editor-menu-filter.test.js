import { describe, expect, test } from "bun:test";

import {
  filterEditorMenuItems,
  isTransformMenuItem,
  isTreeOrTableMenuItem,
} from "./editor-menu-filter.js";

describe("editor-menu-filter", () => {
  describe("isTransformMenuItem", () => {
    test.each([
      [{ title: "Transform" }, true],
      [{ title: "transform data" }, true],
      [{ text: "Transform" }, true],
      [{ text: "transform" }, true],
      [{ className: "jse-transform" }, true],
      [{ className: "btn-transform-action" }, true],
      [{ icon: { iconName: "filter" } }, true],
      [{ value: "transform" }, true],
      [{ id: "transform" }, true],
      [{ text: "Format", title: "Format JSON" }, false],
      [{ text: "Compact", title: "Compact JSON" }, false],
      [{ icon: { iconName: "undo" } }, false],
      [{ icon: { iconName: "redo" } }, false],
      [null, false],
      [undefined, false],
    ])("evaluates item (%j)", (item, expected) => {
      expect(isTransformMenuItem(item)).toBe(expected);
    });
  });

  describe("isTreeOrTableMenuItem", () => {
    test.each([
      [{ text: "tree" }, true],
      [{ value: "tree" }, true],
      [{ title: "tree" }, true],
      [{ id: "tree" }, true],
      [{ text: "table" }, true],
      [{ value: "table" }, true],
      [{ title: "table" }, true],
      [{ id: "table" }, true],
      [{ text: "text", value: "text" }, false],
      [{ text: "Format" }, false],
      [null, false],
    ])("evaluates item (%j)", (item, expected) => {
      expect(isTreeOrTableMenuItem(item)).toBe(expected);
    });
  });

  describe("filterEditorMenuItems", () => {
    test("returns empty array for invalid inputs", () => {
      expect(filterEditorMenuItems(null)).toEqual([]);
      expect(filterEditorMenuItems(undefined)).toEqual([]);
    });

    test("removes transform and tree/table items from flat list", () => {
      const items = [
        { text: "Format" },
        { text: "tree", value: "tree" },
        { title: "Transform", className: "jse-transform" },
        { text: "table", value: "table" },
        { text: "text", value: "text" },
        { text: "Compact" },
      ];

      const result = filterEditorMenuItems(items);

      expect(result).toEqual([
        { text: "Format" },
        { text: "text", value: "text" },
        { text: "Compact" },
      ]);
    });

    test("removes transform and tree/table options from nested dropdown items", () => {
      const items = [
        {
          type: "dropdown-button",
          main: { text: "text" },
          items: [
            { text: "tree", value: "tree" },
            { text: "text", value: "text" },
            { text: "table", value: "table" },
          ],
        },
        {
          type: "button",
          title: "Transform",
          icon: { iconName: "filter" },
        },
        {
          type: "button",
          title: "Format",
        },
      ];

      const result = filterEditorMenuItems(items);

      expect(result).toEqual([
        {
          type: "dropdown-button",
          main: { text: "text" },
          items: [{ text: "text", value: "text" }],
        },
        {
          type: "button",
          title: "Format",
        },
      ]);
    });
  });
});
