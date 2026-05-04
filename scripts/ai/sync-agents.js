// scripts/ai/sync-agents.js
import fs from "fs";
import path from "path";

const root = process.cwd();

// fuente de verdad
const skillsSrc = path.join(root, "docs", "agent-skills");
const agentsSrc = path.join(root, "docs", "AGENTS.md");

const isWindows = process.platform === "win32";

// modo: symlink (default) o copia
const useSymlinks = process.env.AGENT_LINK_MODE !== "copy";

// targets (incluye Claude)
const targets = [
  ".agents/skills",
  ".codex/skills",
  ".agent/skills",
  ".github/skills",
  ".claude/skills",
];

// asegurar carpeta
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// limpiar path si existe
function clean(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

// copiar carpeta completa
function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

// crear symlink
function linkDir(src, dest) {
  fs.symlinkSync(src, dest, isWindows ? "junction" : "dir");
}

// sync skills
function syncSkills() {
  for (const target of targets) {
    const fullTarget = path.join(root, target);

    clean(fullTarget);
    ensureDir(path.dirname(fullTarget));

    if (useSymlinks) {
      linkDir(skillsSrc, fullTarget);
    } else {
      copyDir(skillsSrc, fullTarget);
    }
  }
}

// AGENTS.md → root
function syncAgentsFile() {
  const target = path.join(root, "AGENTS.md");

  clean(target);

  if (useSymlinks) {
    fs.symlinkSync(agentsSrc, target);
  } else {
    fs.copyFileSync(agentsSrc, target);
  }
}

// CLAUDE.md → root
function syncClaudeFile() {
  const target = path.join(root, "CLAUDE.md");

  clean(target);

  if (useSymlinks) {
    fs.symlinkSync(agentsSrc, target);
  } else {
    fs.copyFileSync(agentsSrc, target);
  }
}

// run
function run() {
  if (!fs.existsSync(skillsSrc)) {
    console.error("❌ Missing docs/agent-skills");
    process.exit(1);
  }

  if (!fs.existsSync(agentsSrc)) {
    console.error("❌ Missing docs/AGENTS.md");
    process.exit(1);
  }

  syncSkills();
  syncAgentsFile();
  syncClaudeFile();

  console.log(`✅ Agents synced (${useSymlinks ? "symlinks" : "copy mode"}) across tools`);
}

run();
