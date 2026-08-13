#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const activeTaskPattern = /^- ID activo:\s*(MHB-\d+)\s*$/m;

/**
 * Obtiene el ID MHB activo desde el estado del proyecto.
 *
 * @param {string} status
 * @returns {string | null}
 */
export function getActiveTaskId(status) {
  return status.match(activeTaskPattern)?.[1] ?? null;
}

/**
 * Devuelve la rama de trabajo obligatoria para una tarea MHB.
 *
 * @param {string} taskId
 * @returns {string}
 */
export function getTaskBranch(taskId) {
  return `feature/${taskId.toLowerCase()}`;
}

/**
 * Lanza un error si la rama no corresponde a la tarea activa.
 *
 * @param {string | null} taskId
 * @param {string} branch
 * @returns {void}
 */
export function assertTaskBranch(taskId, branch) {
  if (!taskId || branch === getTaskBranch(taskId)) return;

  throw new Error(
    `La tarea activa ${taskId} requiere la rama ${getTaskBranch(taskId)}; rama actual: ${branch || "(detached HEAD)"}.`,
  );
}

function getCurrentBranch() {
  return execFileSync("git", ["branch", "--show-current"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).trim();
}

function main() {
  const statusPath = path.join(projectRoot, "docs/implementation/STATUS.md");
  const taskId = getActiveTaskId(readFileSync(statusPath, "utf8"));
  const branch = getCurrentBranch();

  assertTaskBranch(taskId, branch);
  console.log(taskId ? `Rama de ${taskId} verificada: ${branch}` : "No hay tarea MHB activa.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(
      `check:task-branch falló: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
