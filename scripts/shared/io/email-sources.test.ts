import { describe, expect, test } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_SOURCE_PATHS } from "../contracts/constants/email-sources.ts";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

describe("EMAIL_SOURCE_PATHS", () => {
  test("cada fuente vigilada existe en disco", () => {
    for (const sourcePath of EMAIL_SOURCE_PATHS) {
      expect({ sourcePath, exists: existsSync(resolve(ROOT, sourcePath)) }).toEqual({
        sourcePath,
        exists: true,
      });
    }
  });

  test("incluye las configuraciones TypeScript de Maizzle y Tailwind email", () => {
    expect(EMAIL_SOURCE_PATHS).toContain("maizzle.config.ts");
    expect(EMAIL_SOURCE_PATHS).toContain("tailwind.email.config.ts");
  });
});
