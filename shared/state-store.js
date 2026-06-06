import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const stateDir = process.env.LOOPS_STATE_DIR ?? "state";

export function getStatePath(loopName, fileName = "state.json") {
  return join(stateDir, loopName, fileName);
}

export async function readJson(filePath, fallback = undefined) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function writeJsonAtomic(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}

export async function readLoopState(loopName, fallback = undefined) {
  return readJson(getStatePath(loopName), fallback);
}

export async function writeLoopState(loopName, value) {
  return writeJsonAtomic(getStatePath(loopName), value);
}
