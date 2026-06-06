import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", "logs", "state"]);
const TEXT_FILE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".yml", ".yaml", ".txt"]);

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot);
}

async function readPackageJson(target) {
  try {
    const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    return {
      found: true,
      name: packageJson.name,
      scripts: packageJson.scripts ?? {},
      dependencies: Object.keys(packageJson.dependencies ?? {}).length,
      devDependencies: Object.keys(packageJson.devDependencies ?? {}).length,
    };
  } catch (error) {
    if (error?.code === "ENOENT") return { found: false };
    return { found: false, error: error.message };
  }
}

async function inspectGit(target) {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--short", "--branch"], {
      cwd: target,
      timeout: 5_000,
      maxBuffer: 100_000,
    });
    const lines = stdout.trim().split("\n").filter(Boolean);
    return {
      found: true,
      branch: lines[0] ?? "",
      changedFiles: Math.max(0, lines.length - 1),
      status: lines,
    };
  } catch (error) {
    return {
      found: false,
      error: error.message,
    };
  }
}

async function walkTextFiles(dir, files = [], limit = 200) {
  if (files.length >= limit) return files;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (files.length >= limit) break;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) await walkTextFiles(fullPath, files, limit);
      continue;
    }
    if (entry.isFile() && TEXT_FILE_EXTENSIONS.has(extensionOf(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function countTodos(target) {
  const rootStat = await stat(target);
  if (!rootStat.isDirectory()) {
    return { scannedFiles: 0, todoCount: 0, error: "Target is not a directory." };
  }

  const files = await walkTextFiles(target);
  let todoCount = 0;
  for (const file of files) {
    const content = await readFile(file, "utf8");
    todoCount += (content.match(/\b(TODO|FIXME)\b/g) ?? []).length;
  }

  return {
    scannedFiles: files.length,
    todoCount,
  };
}

function summarize(checks) {
  const packageScripts = Object.keys(checks.package?.scripts ?? {});
  const hasTests = packageScripts.some((script) => script.includes("test"));
  const hasCheck = packageScripts.some((script) => ["check", "lint", "build", "verify"].includes(script));
  const changedFiles = checks.git?.changedFiles ?? 0;
  const todoCount = checks.todos?.todoCount ?? 0;
  const risks = [];

  if (!checks.package?.found) risks.push("No package.json found.");
  if (checks.package?.found && !hasTests) risks.push("No test script found.");
  if (checks.package?.found && !hasCheck) risks.push("No check/lint/build/verify script found.");
  if (changedFiles > 0) risks.push(`${changedFiles} changed file(s) in git status.`);
  if (todoCount > 20) risks.push(`${todoCount} TODO/FIXME markers found.`);

  return {
    health: risks.length === 0 ? "good" : risks.length <= 2 ? "watch" : "needs-attention",
    packageName: checks.package?.name,
    scripts: packageScripts,
    changedFiles,
    todoCount,
    risks,
  };
}

export default {
  name: "repo-health-check",
  description: "Read-only repository health check loop.",
  maxAttempts: 5,
  timeoutMs: 120_000,

  async init({ input }) {
    return {
      target: resolve(input.target ?? "."),
      checks: {},
      history: [],
    };
  },

  async observe({ state }) {
    return {
      target: state.target,
      completedChecks: Object.keys(state.checks),
    };
  },

  async decide({ observation }) {
    if (!observation.completedChecks.includes("package")) {
      return { type: "inspect-package", reason: "Need package metadata." };
    }
    if (!observation.completedChecks.includes("git")) {
      return { type: "inspect-git", reason: "Need working tree status." };
    }
    if (!observation.completedChecks.includes("todos")) {
      return { type: "count-todos", reason: "Need TODO/FIXME count." };
    }
    return { type: "summarize", reason: "All checks are complete." };
  },

  async act({ state, action }) {
    if (action.type === "inspect-package") {
      state.checks.package = await readPackageJson(state.target);
      return state.checks.package;
    }
    if (action.type === "inspect-git") {
      state.checks.git = await inspectGit(state.target);
      return state.checks.git;
    }
    if (action.type === "count-todos") {
      state.checks.todos = await countTodos(state.target);
      return state.checks.todos;
    }

    state.summary = summarize(state.checks);
    return state.summary;
  },

  async judge({ action, result }) {
    if (action.type === "summarize") {
      return {
        done: true,
        reason: `Repo health is ${result.health}.`,
      };
    }
    return {
      done: false,
      reason: `Completed ${action.type}; continue.`,
    };
  },
};
