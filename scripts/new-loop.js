#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function validateName(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("Loop name must use lowercase letters, numbers, and hyphens.");
  }
}

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.log("Usage: npm run new-loop <loop-name>");
    return;
  }
  validateName(name);

  const templateDir = join(rootDir, "loops", "_template");
  const destination = join(rootDir, "loops", name);
  if (existsSync(destination)) {
    throw new Error(`Loop '${name}' already exists.`);
  }

  await mkdir(destination, { recursive: true });
  await cp(templateDir, destination, { recursive: true });

  for (const fileName of ["loop.js", "README.md"]) {
    const filePath = join(destination, fileName);
    const content = await readFile(filePath, "utf8");
    await writeFile(filePath, content.replaceAll("template-loop", name), "utf8");
  }

  console.log(`Created loops/${name}. Run it with: npm run loop ${name}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
