// @ts-check

import { describe, expect, test } from "bun:test";
import { assertTaskBranch, getActiveTaskId, getTaskBranch } from "./check-task-branch.mjs";

describe("task branch guard", () => {
  test("obtiene el ID MHB activo", () => {
    expect(getActiveTaskId("- ID activo: MHB-03\n- Estado: `En progreso`")).toBe("MHB-03");
    expect(getActiveTaskId("- ID activo: ninguno")).toBeNull();
  });

  test("deriva la rama requerida", () => {
    expect(getTaskBranch("MHB-03")).toBe("feature/mhb-03");
  });

  test("acepta la rama de la tarea y rechaza master", () => {
    expect(() => assertTaskBranch("MHB-03", "feature/mhb-03")).not.toThrow();
    expect(() => assertTaskBranch(null, "master")).not.toThrow();
    expect(() => assertTaskBranch("MHB-03", "master")).toThrow("feature/mhb-03");
  });
});
