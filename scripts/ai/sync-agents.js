// scripts/ai/sync-agents.js
import fs from "fs";
import path from "path";

const root = process.cwd();

// fuente de verdad
const skillsSrc = path.join(root, "docs", "agent-skills");
const agentsSrc = path.join(root, "docs", "AGENTS.md");
const isWindows = process.platform === "win32";

// targets
const targets = [".agents/skills", ".codex/skills", ".agent/skills", ".github/skills"];

// asegurar carpeta
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// copiar (o symlink si quieres)
function syncSkills() {
  for (const target of targets) {
    const fullTarget = path.join(root, target);

    // borra si existe (opcional)
    if (fs.existsSync(fullTarget)) {
      fs.rmSync(fullTarget, { recursive: true, force: true });
    }

    ensureDir(path.dirname(fullTarget));
    // usa symlink (mejor que copiar)
    fs.symlinkSync(skillsSrc, fullTarget, isWindows ? "junction" : "dir");
  }
}

// AGENTS.md → root
function syncAgentsFile() {
  const target = path.join(root, "AGENTS.md");

  if (fs.existsSync(target)) {
    fs.rmSync(target);
  }

  fs.symlinkSync(agentsSrc, target);
}

// run
syncSkills();
syncAgentsFile();

console.log("✅ Agents synced across tools");
