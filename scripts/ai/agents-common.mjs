import { createHash } from "node:crypto";
import { lstat, readFile, readdir, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptDirectory, "../..");
export const configPath = path.join(scriptDirectory, "agents.config.json");

export const generatedMarker = "portfolio-agents:generated";
export const gitignoreStart = "# BEGIN agents:sync managed";
export const gitignoreEnd = "# END agents:sync managed";

export async function pathState(targetPath) {
  try {
    return await lstat(targetPath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function validateRelativePath(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} debe ser una ruta relativa no vacía.`);
  }

  const normalized = path.normalize(value);
  if (path.isAbsolute(value) || normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`${field} debe permanecer dentro del repositorio: ${value}`);
  }

  return normalized;
}

function assertInside(parent, child, field) {
  const relative = path.relative(parent, child);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`)) {
    throw new Error(`${field} debe permanecer dentro de ${parent}: ${child}`);
  }
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

export async function inspectPath(targetPath) {
  const current = await pathState(targetPath);
  if (!current) return { kind: "absent", path: targetPath };
  if (current.isFile()) return { kind: "file", path: targetPath, current };
  if (current.isDirectory()) return { kind: "directory", path: targetPath, current };
  if (!current.isSymbolicLink()) return { kind: "invalid", path: targetPath, current };

  const link = await readlink(targetPath);
  const resolved = path.resolve(path.dirname(targetPath), link);
  try {
    const canonical = await realpath(resolved);
    const canonicalState = await stat(canonical);
    return {
      kind: "symlink",
      path: targetPath,
      current,
      link,
      resolved,
      canonical,
      canonicalState,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { kind: "broken-symlink", path: targetPath, current, link, resolved };
    }
    throw error;
  }
}

export async function loadConfig() {
  let raw;
  try {
    raw = await readFile(configPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`No existe el manifiesto ${path.relative(projectRoot, configPath)}.`, {
        cause: error,
      });
    }
    throw error;
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`El manifiesto no contiene JSON válido: ${error.message}`, {
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

  const seenTargets = new Set();
  const targets = config.targets.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`targets[${index}] debe ser un objeto.`);
    }

    const sourceRelative = validateRelativePath(entry.source, `targets[${index}].source`);
    const targetRelative = validateRelativePath(entry.target, `targets[${index}].target`);
    const source = path.resolve(projectRoot, sourceRelative);
    const target = path.resolve(projectRoot, targetRelative);

    assertInside(path.join(projectRoot, "docs", "ai"), source, `targets[${index}].source`);
    assertInside(projectRoot, target, `targets[${index}].target`);

    const canonicalSourcesRoot = path.join(projectRoot, "docs", "ai");
    if (
      target === canonicalSourcesRoot ||
      target.startsWith(`${canonicalSourcesRoot}${path.sep}`)
    ) {
      throw new Error(`targets[${index}].target no puede administrar fuentes en docs/ai/.`);
    }
    if (target === configPath || target.startsWith(`${scriptDirectory}${path.sep}`)) {
      throw new Error(`targets[${index}].target no puede administrar scripts/ai.`);
    }
    if (seenTargets.has(target)) {
      throw new Error(`Target duplicado: ${entry.target}`);
    }
    seenTargets.add(target);

    const mode = entry.mode ?? "symlink";
    if (!new Set(["symlink", "copy"]).has(mode)) {
      throw new Error(`Modo no soportado para ${entry.target}: ${mode}`);
    }

    return {
      source,
      sourceRelative: sourceRelative.split(path.sep).join("/"),
      target,
      targetRelative: targetRelative.split(path.sep).join("/"),
      mode,
      optional: entry.optional === true,
    };
  });

  const gitignore = config.gitignore.map((value, index) => {
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

  for (let left = 0; left < targets.length; left += 1) {
    for (let right = left + 1; right < targets.length; right += 1) {
      if (isInside(targets[left].target, targets[right].target)) {
        throw new Error(
          `Los targets se superponen: ${targets[left].targetRelative} y ${targets[right].targetRelative}.`,
        );
      }
      if (isInside(targets[right].target, targets[left].target)) {
        throw new Error(
          `Los targets se superponen: ${targets[left].targetRelative} y ${targets[right].targetRelative}.`,
        );
      }
    }
  }

  return { targets, gitignore };
}

async function hashFile(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export async function hashSource(source) {
  const sourceStat = await stat(source);
  if (sourceStat.isFile()) return hashFile(source);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Fuente no soportada: ${path.relative(projectRoot, source)}`);
  }

  const hash = createHash("sha256");
  async function visit(directory, prefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = path.posix.join(prefix, entry.name);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        hash.update(`directory:${relative}\0`);
        await visit(absolute, relative);
      } else if (entry.isFile()) {
        hash.update(`file:${relative}\0`);
        hash.update(await readFile(absolute));
        hash.update("\0");
      } else {
        throw new Error(`La fuente contiene una entrada no soportada: ${relative}`);
      }
    }
  }
  await visit(source);
  return hash.digest("hex");
}

export function copyMarker(sourceRelative, hash) {
  return `<!-- ${generatedMarker} source=${sourceRelative} sha256=${hash} -->`;
}

export async function expectedCopy(target) {
  const sourceStat = await stat(target.source);
  if (!sourceStat.isFile()) {
    throw new Error(
      `El modo copy solo admite archivos; use symlink para ${target.sourceRelative}.`,
    );
  }
  if (path.extname(target.target).toLowerCase() !== ".md") {
    throw new Error(
      `El modo copy requiere un target Markdown para conservar una marca válida: ${target.targetRelative}.`,
    );
  }

  const sourceContent = await readFile(target.source, "utf8");
  const hash = await hashSource(target.source);
  return `${copyMarker(target.sourceRelative, hash)}\n${sourceContent}`;
}

export async function isManagedCopy(targetPath) {
  const targetState = await pathState(targetPath);
  if (!targetState?.isFile()) return false;
  const firstLine = (await readFile(targetPath, "utf8")).split(/\r?\n/, 1)[0];
  return firstLine.startsWith(`<!-- ${generatedMarker} source=`) && firstLine.endsWith(" -->");
}

export async function classifySource(target) {
  const inspection = await inspectPath(target.source);
  if (inspection.kind === "file" || inspection.kind === "directory") return inspection;
  if (inspection.kind === "absent") return inspection;
  if (inspection.kind === "broken-symlink") {
    throw new Error(`La fuente ${target.sourceRelative} es un enlace roto.`);
  }
  if (inspection.kind === "symlink") {
    throw new Error(`La fuente ${target.sourceRelative} no puede ser un enlace.`);
  }
  throw new Error(`La fuente ${target.sourceRelative} tiene un tipo no soportado.`);
}

export async function classifyTarget(target, source) {
  const inspection = await inspectPath(target.target);
  if (inspection.kind === "absent") return { kind: "absent", inspection };
  if (inspection.kind === "broken-symlink") return { kind: "broken-symlink", inspection };
  if (inspection.kind === "symlink") {
    const expected = await realpath(target.source);
    return {
      kind: inspection.canonical === expected ? "managed-symlink" : "unmanaged-symlink",
      inspection,
    };
  }
  if (
    target.mode === "copy" &&
    inspection.kind === "file" &&
    (await isManagedCopy(target.target))
  ) {
    return { kind: "managed-copy", inspection };
  }
  return { kind: inspection.kind === "invalid" ? "invalid" : "manual", inspection, source };
}

export async function validateTargetParent(target) {
  let parent = path.dirname(target.target);
  while (parent !== projectRoot) {
    const parentState = await pathState(parent);
    if (parentState) {
      if (!parentState.isDirectory()) {
        throw new Error(
          `No se puede crear ${target.targetRelative}: su ruta padre no es un directorio.`,
        );
      }
      return;
    }
    parent = path.dirname(parent);
  }
}

export async function canonicalPath(targetPath) {
  try {
    return await realpath(targetPath);
  } catch (error) {
    if (error?.code === "ENOENT") return path.resolve(targetPath);
    throw error;
  }
}

export function expectedGitignoreBlock(patterns) {
  return [gitignoreStart, ...patterns, gitignoreEnd].join("\n");
}

export function replaceGitignoreBlock(content, block) {
  const start = content.indexOf(gitignoreStart);
  const end = content.indexOf(gitignoreEnd);

  if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
    throw new Error("El bloque administrado de .gitignore está incompleto o desordenado.");
  }
  if (
    start !== -1 &&
    (content.indexOf(gitignoreStart, start + gitignoreStart.length) !== -1 ||
      content.indexOf(gitignoreEnd, end + gitignoreEnd.length) !== -1)
  ) {
    throw new Error(".gitignore contiene más de un bloque administrado.");
  }
  if (start === -1) {
    const prefix = content.length === 0 ? "" : `${content.replace(/\s+$/, "")}\n\n`;
    return `${prefix}${block}\n`;
  }

  const after = end + gitignoreEnd.length;
  return `${content.slice(0, start)}${block}${content.slice(after)}`;
}

export function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
