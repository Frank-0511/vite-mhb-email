import { describe, expect, test } from "vitest";
import { detectPackageManager, formatRunCommand } from "./detect-pm.ts";

describe("detectPackageManager", () => {
  test("detecta npm a partir de su user agent", () => {
    const result = detectPackageManager({
      npm_config_user_agent: "npm/10.9.0 node/v24.0.0 darwin arm64",
    });
    expect(result).toBe("npm");
  });

  test("detecta yarn a partir de su user agent", () => {
    const result = detectPackageManager({
      npm_config_user_agent: "yarn/4.18.1 npm/? node/v24.0.0 linux x64",
    });
    expect(result).toBe("yarn");
  });

  test("detecta pnpm a partir de su user agent", () => {
    const result = detectPackageManager({
      npm_config_user_agent: "pnpm/12.10.1 npm/? node/v24.0.0 linux x64",
    });
    expect(result).toBe("pnpm");
  });

  test("detecta bun a partir de su user agent", () => {
    const result = detectPackageManager({
      npm_config_user_agent: "bun/1.3.13 npm/? node/v24.0.0 darwin arm64",
    });
    expect(result).toBe("bun");
  });

  test("usa npm por defecto ante un user agent desconocido", () => {
    const result = detectPackageManager({
      npm_config_user_agent: "cnpm/9.0.0",
    });
    expect(result).toBe("npm");
  });

  test("usa npm por defecto con env vacío", () => {
    const result = detectPackageManager({});
    expect(result).toBe("npm");
  });
});

describe("formatRunCommand", () => {
  test("formatea el comando con el package manager especificado", () => {
    const command = formatRunCommand("build", "yarn");
    expect(command).toBe("yarn run build");
  });
});
