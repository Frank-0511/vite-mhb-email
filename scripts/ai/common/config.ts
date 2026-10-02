import { readFile } from "node:fs/promises";
import path from "node:path";
import { configPath as defaultManifestPath, projectRoot, scriptDirectory } from "./constants.ts";
import { isEnoent } from "./errors.ts";
import { assertInside, isInside, validateRelativePath } from "./paths.ts";
import type { LoadedAgentsConfig, TargetConfig } from "./types.ts";

/**
 * Valida y normaliza un objeto target individual del manifiesto.
 *
 * @param {unknown} entry
 * @param {number} index
 * @param {Set<string>} seenTargets
 * @param {string} manifestPath
 * @returns {TargetConfig}
 */
function validateTargetEntry(
  entry: unknown,
  index: number,
  seenTargets: Set<string>,
  manifestPath: string,
): TargetConfig {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new Error(`targets[${index}] debe ser un objeto.`);
  }

  const targetObj = entry as Record<string, unknown>;
  const sourceRelative = validateRelativePath(targetObj.source, `targets[${index}].source`);
  const targetRelative = validateRelativePath(targetObj.target, `targets[${index}].target`);
  const source = path.resolve(projectRoot, sourceRelative);
  const target = path.resolve(projectRoot, targetRelative);

  const canonicalSourcesRoot = path.join(projectRoot, "docs", "ai");
  assertInside(canonicalSourcesRoot, source, `targets[${index}].source`);
  assertInside(projectRoot, target, `targets[${index}].target`);

  if (target === canonicalSourcesRoot || target.startsWith(`${canonicalSourcesRoot}${path.sep}`)) {
    throw new Error(`targets[${index}].target no puede administrar fuentes en docs/ai/.`);
  }
  if (target === manifestPath || target.startsWith(`${scriptDirectory}${path.sep}`)) {
    throw new Error(`targets[${index}].target no puede administrar scripts/ai.`);
  }
  if (seenTargets.has(target)) {
    throw new Error(`Target duplicado: ${String(targetObj.target)}`);
  }
  seenTargets.add(target);

  const mode = targetObj.mode ?? "symlink";
  if (mode !== "symlink" && mode !== "copy") {
    throw new Error(`Modo no soportado para ${String(targetObj.target)}: ${String(mode)}`);
  }

  return {
    source,
    sourceRelative: sourceRelative.split(path.sep).join("/"),
    target,
    targetRelative: targetRelative.split(path.sep).join("/"),
    mode,
    optional: targetObj.optional === true,
  };
}

/**
 * Valida que no existan superposiciones o anidamientos ilegales entre targets.
 *
 * @param {readonly TargetConfig[]} targets
 * @returns {void}
 */
export function assertNoTargetOverlaps(targets: readonly TargetConfig[]): void {
  for (let left = 0; left < targets.length; left += 1) {
    for (let right = left + 1; right < targets.length; right += 1) {
      if (
        isInside(targets[left].target, targets[right].target) ||
        isInside(targets[right].target, targets[left].target)
      ) {
        throw new Error(
          `Los targets se superponen: ${targets[left].targetRelative} y ${targets[right].targetRelative}.`,
        );
      }
    }
  }
}

/**
 * Carga, parsea y valida semánticamente el manifiesto de configuración de agentes.
 *
 * @param {string} [manifestPath] Ruta al archivo de configuración (por defecto `configPath`).
 * @returns {Promise<LoadedAgentsConfig>}
 */
export async function loadConfig(
  manifestPath: string = defaultManifestPath,
): Promise<LoadedAgentsConfig> {
  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch (error) {
    if (isEnoent(error)) {
      throw new Error(`No existe el manifiesto ${path.relative(projectRoot, manifestPath)}.`, {
        cause: error,
      });
    }
    throw error;
  }

  let config: Record<string, unknown>;
  try {
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`El manifiesto no contiene JSON válido: ${message}`, {
      cause: error,
    });
  }

  if (config.version !== 1) {
    throw new Error("agents.config.json debe declarar version: 1.");
  }
  if (!Array.isArray(config.targets) || config.targets.length === 0) {
    throw new Error("agents.config.json debe declarar al menos un target.");
  }
  if (!Array.isArray(config.gitignore)) {
    throw new Error("agents.config.json debe declarar gitignore como arreglo.");
  }

  const seenTargets = new Set<string>();
  const targets = (config.targets as unknown[]).map((entry, index) =>
    validateTargetEntry(entry, index, seenTargets, manifestPath),
  );

  const gitignore = (config.gitignore as unknown[]).map((value, index) => {
    const normalized = validateRelativePath(value, `gitignore[${index}]`);
    return normalized.split(path.sep).join("/");
  });

  const duplicateGitignore = gitignore.find(
    (pattern, index) => gitignore.indexOf(pattern) !== index,
  );
  if (duplicateGitignore) {
    throw new Error(`Patrón duplicado en gitignore: ${duplicateGitignore}`);
  }

  for (const target of targets) {
    const ignored = gitignore.some(
      (pattern) => pattern.replace(/\/$/, "") === target.targetRelative,
    );
    if (!ignored) {
      throw new Error(`El target ${target.targetRelative} debe estar declarado en gitignore.`);
    }
  }

  assertNoTargetOverlaps(targets);

  return { targets, gitignore };
}
