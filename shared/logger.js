import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export function createRunLogger({ scope = "loop", logDir = process.env.LOOPS_LOG_DIR ?? "logs", quiet = false } = {}) {
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, "runs.jsonl");

  const write = (level, event, data = {}) => {
    const record = {
      ts: new Date().toISOString(),
      level,
      scope,
      event,
      data,
    };
    appendFileSync(logPath, `${JSON.stringify(record)}\n`);
    if (!quiet) {
      const payload = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : "";
      const line = `[${scope}] ${event}${payload}`;
      if (level === "error") console.error(line);
      else if (level === "warn") console.warn(line);
      else console.log(line);
    }
  };

  return {
    info: (event, data) => write("info", event, data),
    warn: (event, data) => write("warn", event, data),
    error: (event, data) => write("error", event, data),
  };
}
