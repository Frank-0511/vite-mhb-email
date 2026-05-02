import { describe, expect, test } from "bun:test";

import {
  getCommittedCustomViewportWidth,
  getLiveCustomViewportWidth,
} from "./viewport-controls.js";

describe("viewport custom width controls", () => {
  test("keeps partial input editable while typing custom widths", () => {
    expect(getLiveCustomViewportWidth("1")).toBeNull();
    expect(getLiveCustomViewportWidth("10")).toBeNull();
    expect(getLiveCustomViewportWidth("102")).toBeNull();
    expect(getLiveCustomViewportWidth("1024")).toBe(1024);
  });

  test("normalizes custom width only when committing", () => {
    expect(getCommittedCustomViewportWidth("", 600)).toBe(600);
    expect(getCommittedCustomViewportWidth("1", 600)).toBe(280);
    expect(getCommittedCustomViewportWidth("1300", 600)).toBe(1200);
  });
});
