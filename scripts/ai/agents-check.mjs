#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  classifySource,
  classifyTarget,
  expectedCopy,
  expectedGitignoreBlock,
  formatError,
  gitignoreEnd,
  gitignoreStart,
  loadConfig,
  pathState,
  projectRoot,
} from "./agents-common.mjs";

async function checkTarget(target) {
  let source;
  try {
    source = await classifySource(target);
  } catch (error) {
    return formatError(error);
  }

  if (source.kind === "absent") {
    if (target.optional && !(await pathState(target.target))) return null;
    return `falta la fuente ${target.sourceRelative}`;
  }
  const current = await classifyTarget(target, source);
  if (current.kind === "absent") return `falta el target ${target.targetRelative}`;
  if (current.kind === "broken-symlink") return `${target.targetRelative} es un enlace roto`;
  if (current.kind === "unmanaged-symlink") {
    return `${target.targetRelative} apunta a un enlace no administrado`;
  }
  if (current.kind === "manual") return `${target.targetRelative} no es un target administrado`;
  if (current.kind === "invalid") return `${target.targetRelative} tiene un tipo no soportado`;
  if (current.kind === "managed-symlink") {
    return target.mode === "symlink" ? null : `${target.targetRelative} no coincide con el modo copy`;
  }
  if (target.mode !== "copy") return `${target.targetRelative} no coincide con el modo symlink`;

  const actual = await readFile(target.target, "utf8");
  const expected = await expectedCopy(target);
  return actual === expected ? null : `${target.targetRelative} tiene drift`;
}

async function checkGitignore(patterns) {
  const gitignorePath = path.join(projectRoot, ".gitignore");
  let content;
  try {
    content = await readFile(gitignorePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "falta .gitignore";
    throw error;
  }

  const start = content.indexOf(gitignoreStart);
  const end = content.indexOf(gitignoreEnd);
  if (start === -1 || end === -1 || end < start) {
    return "falta el bloque administrado en .gitignore";
  }
  if (
    content.indexOf(gitignoreStart, start + gitignoreStart.length) !== -1 ||
    content.indexOf(gitignoreEnd, end + gitignoreEnd.length) !== -1
  ) {
    return ".gitignore contiene más de un bloque administrado";
  }

  const actual = content.slice(start, end + gitignoreEnd.length);
  return actual === expectedGitignoreBlock(patterns)
    ? null
    : "el bloque administrado de .gitignore tiene drift";
}

async function main() {
  const config = await loadConfig();
  const failures = [];

  for (const target of config.targets) {
    try {
      const failure = await checkTarget(target);
      if (failure) failures.push(failure);
    } catch (error) {
      failures.push(`${target.targetRelative}: ${formatError(error)}`);
    }
  }

  const gitignoreFailure = await checkGitignore(config.gitignore);
  if (gitignoreFailure) failures.push(gitignoreFailure);

  if (failures.length > 0) {
    for (const failure of failures) console.error(`- ${failure}`);
    throw new Error(`${failures.length} comprobación(es) fallaron.`);
  }

  console.log(`agents:check correcto (${config.targets.length} targets declarados).`);
}

main().catch((error) => {
  console.error(`agents:check falló: ${formatError(error)}`);
  process.exitCode = 1;
});
