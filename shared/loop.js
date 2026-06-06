const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export class LoopTimeoutError extends Error {
  constructor(label) {
    super(`Loop timed out while running ${label}`);
    this.name = "LoopTimeoutError";
  }
}

export function validateLoopDefinition(loop) {
  if (!loop || typeof loop !== "object") {
    throw new TypeError("Loop definition must be an object.");
  }
  if (!loop.name || typeof loop.name !== "string") {
    throw new TypeError("Loop definition requires a string name.");
  }
  for (const method of ["observe", "decide", "act", "judge"]) {
    if (typeof loop[method] !== "function") {
      throw new TypeError(`Loop '${loop.name}' requires ${method}().`);
    }
  }
}

function positiveInteger(value, fallback, label) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return number;
}

function createState(state) {
  return {
    attempts: 0,
    history: [],
    ...state,
    history: Array.isArray(state?.history) ? state.history : [],
  };
}

function basicLogger() {
  return {
    info: (event, data) => console.log(event, data ?? ""),
    warn: (event, data) => console.warn(event, data ?? ""),
    error: (event, data) => console.error(event, data ?? ""),
  };
}

async function withDeadline(label, deadline, work) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new LoopTimeoutError(label);

  let timer;
  try {
    return await Promise.race([
      work(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new LoopTimeoutError(label)), remaining);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function stringifyError(error) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export async function runAgenticLoop(loop, options = {}) {
  validateLoopDefinition(loop);

  const maxAttempts = positiveInteger(
    options.maxAttempts ?? loop.maxAttempts,
    DEFAULT_MAX_ATTEMPTS,
    "maxAttempts"
  );
  const timeoutMs = positiveInteger(
    options.timeoutMs ?? loop.timeoutMs,
    DEFAULT_TIMEOUT_MS,
    "timeoutMs"
  );

  const startedAt = new Date().toISOString();
  const deadline = Date.now() + timeoutMs;
  const logger = options.logger ?? basicLogger();
  const input = options.input ?? {};

  let state = createState(
    await withDeadline("init", deadline, async () =>
      typeof loop.init === "function"
        ? loop.init({ input, logger, startedAt })
        : undefined
    )
  );

  const finish = async (status, reason, extra = {}) => {
    const finishedAt = new Date().toISOString();
    const result = {
      loop: loop.name,
      status,
      ok: ["completed", "stopped"].includes(status),
      reason,
      attempts: state.attempts,
      startedAt,
      finishedAt,
      state,
      ...extra,
    };
    if (typeof loop.save === "function") {
      await loop.save({ input, state, result, logger });
    }
    logger.info("loop.finished", {
      loop: loop.name,
      status,
      reason,
      attempts: state.attempts,
    });
    return result;
  };

  logger.info("loop.started", { loop: loop.name, maxAttempts, timeoutMs });

  try {
    for (let turn = 1; turn <= maxAttempts; turn += 1) {
      const base = { input, state, turn, maxAttempts, deadline, logger };

      const observation = await withDeadline("observe", deadline, () =>
        loop.observe(base)
      );
      const action = await withDeadline("decide", deadline, () =>
        loop.decide({ ...base, observation })
      );

      if (!action || typeof action.type !== "string") {
        throw new TypeError(`Loop '${loop.name}' decide() must return an action with a string type.`);
      }

      if (action.type === "stop") {
        return finish("stopped", action.reason ?? "Loop requested stop.", { action });
      }

      if (action.requiresApproval) {
        const approved = typeof options.approve === "function"
          ? await options.approve(action)
          : false;
        if (!approved) {
          return finish("blocked", `Approval required for action '${action.type}'.`, { action });
        }
      }

      const actResult = await withDeadline("act", deadline, () =>
        loop.act({ ...base, observation, action })
      );
      const verdict = await withDeadline("judge", deadline, () =>
        loop.judge({ ...base, observation, action, result: actResult })
      );

      state.attempts = turn;
      state.history.push({
        turn,
        at: new Date().toISOString(),
        observation,
        action,
        result: actResult,
        verdict,
      });

      if (typeof loop.save === "function") {
        await loop.save({ input, state, logger });
      }

      if (verdict?.done) {
        return finish("completed", verdict.reason ?? "Goal achieved.", {
          result: actResult,
          verdict,
        });
      }
    }

    return finish("max_attempts", `Stopped after ${maxAttempts} attempts.`);
  } catch (error) {
    const status = error instanceof LoopTimeoutError ? "timeout" : "failed";
    const reason = stringifyError(error);
    logger.error("loop.failed", { loop: loop.name, status, reason });
    return finish(status, reason, { error: reason });
  }
}
