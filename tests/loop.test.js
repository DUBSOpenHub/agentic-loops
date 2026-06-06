import test from "node:test";
import assert from "node:assert/strict";
import { runAgenticLoop } from "../shared/loop.js";

const quietLogger = {
  info() {},
  warn() {},
  error() {},
};

test("runs until judge marks the loop done", async () => {
  const loop = {
    name: "test-loop",
    maxAttempts: 3,
    async init() {
      return { count: 0, history: [] };
    },
    async observe({ state }) {
      return { count: state.count };
    },
    async decide() {
      return { type: "increment" };
    },
    async act({ state }) {
      state.count += 1;
      return { count: state.count };
    },
    async judge({ result }) {
      return { done: result.count === 2 };
    },
  };

  const result = await runAgenticLoop(loop, { logger: quietLogger });
  assert.equal(result.status, "completed");
  assert.equal(result.attempts, 2);
  assert.equal(result.state.count, 2);
});

test("stops when max attempts are reached", async () => {
  const loop = {
    name: "max-loop",
    async observe() {
      return {};
    },
    async decide() {
      return { type: "continue" };
    },
    async act() {
      return {};
    },
    async judge() {
      return { done: false };
    },
  };

  const result = await runAgenticLoop(loop, { logger: quietLogger, maxAttempts: 2 });
  assert.equal(result.status, "max_attempts");
  assert.equal(result.ok, false);
  assert.equal(result.attempts, 2);
});

test("blocks approval-required actions by default", async () => {
  const loop = {
    name: "approval-loop",
    async observe() {
      return {};
    },
    async decide() {
      return { type: "write-file", requiresApproval: true };
    },
    async act() {
      throw new Error("act should not run without approval");
    },
    async judge() {
      return { done: true };
    },
  };

  const result = await runAgenticLoop(loop, { logger: quietLogger });
  assert.equal(result.status, "blocked");
  assert.equal(result.attempts, 0);
});
