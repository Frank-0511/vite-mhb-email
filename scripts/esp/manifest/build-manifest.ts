/**
 * @fileoverview Construcción en memoria del manifiesto ESP para los templates compilados en dist/.
 */

import fs from "node:fs";
import path from "node:path";
import {
  ESP_MANIFEST_PROFILES,
  ESP_PROFILES,
  LEGACY_ESP_PROFILE,
} from "../../shared/contracts/constants/esp-contract.ts";
import { getProjectPaths } from "../../shared/io/paths.ts";
import { extractEspVariablesFromHtml } from "../../validators/dist-baseline/snapshot.ts";
import { parseEspFrontmatter } from "../frontmatter.ts";
import { analyzeLegacyCompat, formatSubstitutionTag } from "../syntax/legacy-compat.ts";
import { buildExampleData } from "./example-data.ts";
import type { EspManifest, EspManifestTemplate } from "./manifest-types.ts";

/**
 * Construye el objeto de manifiesto ESP analizando los templates compilados en dist/.
 *
 * @param rootDir Directorio raíz del proyecto.
 * @returns Estructura completa y determinista del manifiesto ESP.
 */
export function buildEspManifest(rootDir: string): EspManifest {
  const paths = getProjectPaths(rootDir);

  if (!fs.existsSync(paths.distDir)) {
    throw new Error("El directorio dist/ no existe. Ejecuta bun run build primero.");
  }

  const htmlFiles = fs
    .readdirSync(paths.distDir)
    .filter((file) => file.endsWith(".html"))
    .sort();

  const legacyProfile = ESP_PROFILES[LEGACY_ESP_PROFILE];
  const templates: Record<string, EspManifestTemplate> = {};

  for (const file of htmlFiles) {
    const templateName = file.replace(/\.html$/i, "");
    const filePath = path.join(paths.distDir, file);
    const html = fs.readFileSync(filePath, "utf8");

    const requiredVariables = extractEspVariablesFromHtml(html);

    const sourcePath = paths.templateHtml(templateName);
    let intentionalVariables: string[] = [];
    if (fs.existsSync(sourcePath)) {
      const source = fs.readFileSync(sourcePath, "utf8");
      const frontmatter = parseEspFrontmatter(source);
      if (frontmatter.espVariables) {
        intentionalVariables = Array.from(new Set(frontmatter.espVariables)).sort();
      }
    }

    const unionKeys = Array.from(new Set([...requiredVariables, ...intentionalVariables])).sort();

    const dataPath = paths.templateData(templateName);
    let data: unknown = {};
    if (fs.existsSync(dataPath)) {
      try {
        data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      } catch {
        data = {};
      }
    }

    const exampleData = buildExampleData(unionKeys, data);

    const tags: Record<string, string> = {};
    for (const variable of requiredVariables) {
      tags[variable] = formatSubstitutionTag(legacyProfile, variable);
    }

    const legacyAnalysis = analyzeLegacyCompat(html);
    const issues: string[] = [];
    for (const violation of legacyAnalysis.violations) {
      issues.push(`${violation.token} — ${violation.reason}`);
    }
    for (const collision of legacyAnalysis.collisions) {
      const varName = collision.replace(/^-|-$/g, "");
      issues.push(
        `el texto "${collision}" colisiona con la etiqueta legacy de la variable ${varName}`,
      );
    }

    const convertible = issues.length === 0;

    templates[templateName] = {
      file,
      requiredVariables,
      intentionalVariables,
      exampleData,
      legacy: {
        convertible,
        tags,
        issues,
      },
    };
  }

  return {
    version: 1,
    profiles: [...ESP_MANIFEST_PROFILES],
    templates,
  };
}
