import { describe, expect, test } from "vitest";
import type { DistSnapshot } from "./baseline-guard.ts";
import { compareManifestWithBaseline } from "./manifest-check.ts";
import type { EspManifest } from "../../esp/manifest/types.ts";

describe("compareManifestWithBaseline", () => {
  const sampleBaseline: DistSnapshot = {
    version: 1,
    templates: {
      "welcome.html": {
        sha256: "abc123hash",
        espVariables: ["dashboard_url", "first_name"],
      },
      "newsletter.html": {
        sha256: "def456hash",
        espVariables: ["issue_number"],
      },
    },
  };

  const sampleManifest: EspManifest = {
    version: 1,
    profiles: ["sendgrid", "sendgrid-legacy"],
    templates: {
      welcome: {
        file: "welcome.html",
        requiredVariables: ["dashboard_url", "first_name"],
        intentionalVariables: [],
        exampleData: {
          dashboard_url: "https://miempresa.com",
          first_name: "<first_name>",
        },
        legacy: {
          convertible: true,
          tags: {
            dashboard_url: "-dashboard_url-",
            first_name: "-first_name-",
          },
          issues: [],
        },
      },
      newsletter: {
        file: "newsletter.html",
        requiredVariables: ["issue_number"],
        intentionalVariables: [],
        exampleData: {
          issue_number: "#1",
        },
        legacy: {
          convertible: true,
          tags: {
            issue_number: "-issue_number-",
          },
          issues: [],
        },
      },
    },
  };

  test("retorna lista vacía si manifiesto y baseline coinciden", () => {
    const errors = compareManifestWithBaseline(sampleManifest, sampleBaseline);
    expect(errors).toEqual([]);
  });

  test("reporta error si el manifiesto no es válido según isEspManifest", () => {
    const errors = compareManifestWithBaseline({ version: 999 }, sampleBaseline);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("contrato EspManifest");
  });

  test("reporta error si falta una plantilla del baseline en el manifiesto", () => {
    const incompleteManifest: EspManifest = {
      ...sampleManifest,
      templates: {
        welcome: sampleManifest.templates.welcome,
      },
    };
    const errors = compareManifestWithBaseline(incompleteManifest, sampleBaseline);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("newsletter.html");
  });

  test("reporta error si el manifiesto incluye una plantilla ausente en baseline", () => {
    const extraManifest: EspManifest = {
      ...sampleManifest,
      templates: {
        ...sampleManifest.templates,
        extra: {
          file: "extra.html",
          requiredVariables: [],
          intentionalVariables: [],
          exampleData: {},
          legacy: { convertible: true, tags: {}, issues: [] },
        },
      },
    };
    const errors = compareManifestWithBaseline(extraManifest, sampleBaseline);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("extra.html");
  });

  test("reporta error si requiredVariables difiere de espVariables del baseline", () => {
    const mismatchManifest: EspManifest = {
      ...sampleManifest,
      templates: {
        ...sampleManifest.templates,
        welcome: {
          ...sampleManifest.templates.welcome,
          requiredVariables: ["dashboard_url", "other_var"],
          legacy: {
            ...sampleManifest.templates.welcome.legacy,
            tags: {
              dashboard_url: "-dashboard_url-",
              other_var: "-other_var-",
            },
          },
        },
      },
    };
    const errors = compareManifestWithBaseline(mismatchManifest, sampleBaseline);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("requiredVariables");
  });

  test("reporta error si legacy.tags difiere de requiredVariables", () => {
    const misalignedTags: EspManifest = {
      ...sampleManifest,
      templates: {
        ...sampleManifest.templates,
        welcome: {
          ...sampleManifest.templates.welcome,
          legacy: {
            ...sampleManifest.templates.welcome.legacy,
            tags: {
              dashboard_url: "-dashboard_url-",
              // falta first_name
            },
          },
        },
      },
    };
    const errors = compareManifestWithBaseline(misalignedTags, sampleBaseline);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("legacy.tags");
  });
});
