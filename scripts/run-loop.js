#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runAgenticLoop } from "../shared/loop.js";
import { createRunLogger } from "../shared/logger.js";
import { requestApproval } from "../shared/approvals.js";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith("--")) {
      positional.push(value);
      continue;
    }
    const key = value.slice(2);
    if (key === "auto-approve" || key === "quiet") {
      flags[key] = true;
      continue;
    }
    flags[key] = argv[i + 1];
    i += 1;
  }
  return { loopName: positional[0], extra: positional.slice(1), flags };
}

async function listLoops() {
  const loopsDir = join(rootDir, "loops");
  const entries = await readdir(loopsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

async function loadLoop(loopName) {
  const loopPath = join(rootDir, "loops", loopName, "loop.js");
  if (!existsSync(loopPath)) {
    const available = await listLoops();
    throw new Error(`Unknown loop '${loopName}'. Available loops: ${available.join(", ")}`);
  }
  const module = await import(pathToFileURL(loopPath).href);
  return module.default;
}

async function main() {
  const { loopName, extra, flags } = parseArgs(process.argv.slice(2));
  if (!loopName) {
    const available = await listLoops();
    console.log(`Usage: npm run loop <loop-name> [-- --target path]\n\nAvailable loops:\n- ${available.join("\n- ")}`);
    return;
  }

  const loop = await loadLoop(loopName);
  const logger = createRunLogger({ scope: loop.name, quiet: flags.quiet === true });
  const target = flags.target ? resolve(String(flags.target)) : process.cwd();

  const result = await runAgenticLoop(loop, {
    logger,
    maxAttempts: flags["max-attempts"],
    timeoutMs: flags["timeout-ms"],
    input: {
      target,
      args: extra,
      flags,
    },
    approve: (action) => requestApproval(action, { autoApprove: flags["auto-approve"] === true }),
  });

  const stateDir = process.env.LOOPS_STATE_DIR ?? "state";
  const summaryPath = join(rootDir, stateDir, loop.name, "last-run.json");
  await mkdir(dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log("\nResult:");
  console.log(JSON.stringify({
    loop: result.loop,
    status: result.status,
    ok: result.ok,
    reason: result.reason,
    attempts: result.attempts,
    savedTo: summaryPath,
  }, null, 2));

  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
