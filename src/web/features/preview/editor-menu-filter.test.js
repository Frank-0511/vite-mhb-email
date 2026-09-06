import { describe, expect, test } from "bun:test";

import {
  filterEditorMenuItems,
  isTransformMenuItem,
  isTreeOrTableMenuItem,
} from "./editor-menu-filter.js";

describe("editor-menu-filter", () => {
  describe("isTransformMenuItem", () => {
    test("detects transform item by title", () => {
      expect(isTransformMenuItem({ title: "Transform" })).toBe(true);
      expect(isTransformMenuItem({ title: "transform data" })).toBe(true);
    });

    test("detects transform item by text", () => {
      expect(isTransformMenuItem({ text: "Transform" })).toBe(true);
      expect(isTransformMenuItem({ text: "transform" })).toBe(true);
    });

    test("detects transform item by className", () => {
      expect(isTransformMenuItem({ className: "jse-transform" })).toBe(true);
      expect(isTransformMenuItem({ className: "btn-transform-action" })).toBe(true);
    });

    test("detects transform item by filter icon", () => {
      expect(isTransformMenuItem({ icon: { iconName: "filter" } })).toBe(true);
    });

    test("detects transform item by value or id", () => {
      expect(isTransformMenuItem({ value: "transform" })).toBe(true);
      expect(isTransformMenuItem({ id: "transform" })).toBe(true);
    });

    test("returns false for non-transform items", () => {
      expect(isTransformMenuItem({ text: "Format", title: "Format JSON" })).toBe(false);
      expect(isTransformMenuItem({ text: "Compact", title: "Compact JSON" })).toBe(false);
      expect(isTransformMenuItem({ icon: { iconName: "undo" } })).toBe(false);
      expect(isTransformMenuItem({ icon: { iconName: "redo" } })).toBe(false);
      expect(isTransformMenuItem(null)).toBe(false);
      expect(isTransformMenuItem(undefined)).toBe(false);
    });
  });

  describe("isTreeOrTableMenuItem", () => {
    test("detects tree mode item by text, value, title, or id", () => {
      expect(isTreeOrTableMenuItem({ text: "tree" })).toBe(true);
      expect(isTreeOrTableMenuItem({ value: "tree" })).toBe(true);
      expect(isTreeOrTableMenuItem({ title: "tree" })).toBe(true);
      expect(isTreeOrTableMenuItem({ id: "tree" })).toBe(true);
    });

    test("detects table mode item by text, value, title, or id", () => {
      expect(isTreeOrTableMenuItem({ text: "table" })).toBe(true);
      expect(isTreeOrTableMenuItem({ value: "table" })).toBe(true);
      expect(isTreeOrTableMenuItem({ title: "table" })).toBe(true);
      expect(isTreeOrTableMenuItem({ id: "table" })).toBe(true);
    });

    test("returns false for text mode or other items", () => {
      expect(isTreeOrTableMenuItem({ text: "text", value: "text" })).toBe(false);
      expect(isTreeOrTableMenuItem({ text: "Format" })).toBe(false);
      expect(isTreeOrTableMenuItem(null)).toBe(false);
    });
  });

  describe("filterEditorMenuItems", () => {
    test("returns empty array for invalid inputs", () => {
      // @ts-expect-error test defensivo
      expect(filterEditorMenuItems(null)).toEqual([]);
      // @ts-expect-error test defensivo
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
