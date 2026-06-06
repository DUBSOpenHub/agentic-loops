# Agentic Loops Repo Rules

This repo is for small, standalone agentic loops. Keep every loop bounded, observable, and safe by default.

- Every loop must have a clear stop rule: max attempts, timeout, or done verdict.
- Log meaningful decisions and final outcomes.
- Store state under `state/`; do not commit generated state or logs.
- Require explicit approval before destructive, external-facing, credential-related, or production-impacting actions.
- Prefer read-only examples unless the loop name and README make write behavior obvious.
- Each loop exports a default definition compatible with `shared/loop.js`.
