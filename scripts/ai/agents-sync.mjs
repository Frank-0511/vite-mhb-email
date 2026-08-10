#!/usr/bin/env node

import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  classifySource,
  classifyTarget,
  expectedCopy,
  expectedGitignoreBlock,
  formatError,
  loadConfig,
  pathState,
  projectRoot,
  replaceGitignoreBlock,
  validateTargetParent,
} from "./agents-common.mjs";

async function planGitignore(patterns) {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  let current = "";
  try {
    current = await readFile(gitignorePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  return {
    current,
    gitignorePath,
    next: replaceGitignoreBlock(current, expectedGitignoreBlock(patterns)),
  };
}

export async function buildSyncPlan() {
  const config = await loadConfig();
  const entries = [];

  for (const target of config.targets) {
    const source = await classifySource(target);

    if (source.kind === "absent") {
      if (target.optional && !(await pathState(target.target))) {
        entries.push({ target, action: "omit" });
        continue;
      }
      throw new Error(`No existe la fuente ${target.sourceRelative}.`);
    }

    const targetState = await classifyTarget(target, source);

    if (targetState.kind === "broken-symlink") {
      throw new Error(`Se rechazó el enlace roto en ${target.targetRelative}.`);
    }
    if (targetState.kind === "unmanaged-symlink" || targetState.kind === "manual") {
      throw new Error(`Se rechazó sobrescribir contenido manual en ${target.targetRelative}.`);
    }
    if (targetState.kind === "invalid") {
      throw new Error(`Se rechazó el tipo no soportado en ${target.targetRelative}.`);
    }
    if (targetState.kind === "managed-symlink" && target.mode !== "symlink") {
      throw new Error(`Se rechazó sobrescribir contenido manual en ${target.targetRelative}.`);
    }
    if (targetState.kind === "managed-copy" && target.mode !== "copy") {
      throw new Error(`Se rechazó sobrescribir contenido manual en ${target.targetRelative}.`);
    }

    await validateTargetParent(target);
    const expected = target.mode === "copy" ? await expectedCopy(target) : null;
    const current =
      targetState.kind === "managed-copy" ? await readFile(target.target, "utf8") : null;
    entries.push({
      target,
      expected,
      action:
        targetState.kind === "absent"
          ? "create"
          : target.mode === "copy" && current !== expected
            ? "update-copy"
            : "unchanged",
    });
  }

  return { config, entries, gitignore: await planGitignore(config.gitignore) };
}

async function applyEntry(entry) {
  if (entry.action === "omit") {
    console.log(`omitido ${entry.target.targetRelative}: fuente opcional ausente`);
    return;
  }
  if (entry.action === "unchanged") {
    console.log(`${entry.target.targetRelative}: sin cambios`);
    return;
  }

  await mkdir(path.dirname(entry.target.target), { recursive: true });
  if (entry.target.mode === "copy") {
    await writeFile(entry.target.target, entry.expected, "utf8");
    console.log(
      `${entry.target.targetRelative}: ${entry.action === "create" ? "copia creada" : "copia actualizada"}`,
    );
    return;
  }

  const relativeSource = path.relative(path.dirname(entry.target.target), entry.target.source);
  const source = await classifySource(entry.target);
  const linkType =
    source.kind === "directory" ? (process.platform === "win32" ? "junction" : "dir") : "file";
  await symlink(
    linkType === "junction" ? entry.target.source : relativeSource,
    entry.target.target,
    linkType,
  );
  console.log(`${entry.target.targetRelative}: enlace creado`);
}

async function main() {
  const plan = await buildSyncPlan();
  for (const entry of plan.entries) await applyEntry(entry);

  if (plan.gitignore.next === plan.gitignore.current) {
    console.log(".gitignore: sin cambios");
  } else {
    await writeFile(plan.gitignore.gitignorePath, plan.gitignore.next, "utf8");
    console.log(`.gitignore: ${plan.gitignore.current === "" ? "creado" : "actualizado"}`);
  }
}

main().catch((error) => {
  console.error(`agents:sync falló: ${formatError(error)}`);
  process.exitCode = 1;
});
