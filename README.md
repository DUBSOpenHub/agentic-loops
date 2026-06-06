# Agentic Loops

[![CI](https://github.com/DUBSOpenHub/agentic-loops/actions/workflows/ci.yml/badge.svg)](https://github.com/DUBSOpenHub/agentic-loops/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Node.js >=20](https://img.shields.io/badge/node-%3E%3D20-232F3E.svg)

A home for standalone agentic loops: tiny programs that can observe, decide, act, judge, save state, and stop safely.

The goal is to make every loop reusable and understandable:

```text
Goal -> Observe -> Decide -> Act -> Judge -> Save -> Repeat or Stop
```

## Quick start

```bash
npm run loop:hello
npm run loop:repo-health
```

Create a new loop from the template:

```bash
npm run new-loop my-daily-check
npm run loop my-daily-check
```

## Repo layout

```text
loops/
  _template/           reusable starter loop
  hello-loop/          tiny learning example
  repo-health-check/   read-only repo inspection loop

shared/
  loop.js              generic loop runner
  logger.js            JSONL + console logger
  state-store.js       local JSON state helpers
  approvals.js         approval prompt helpers

scripts/
  run-loop.js          run any loop by folder name
  new-loop.js          create a loop from the template
```

## Safety model

Each loop should answer five questions:

| Question | Example |
|---|---|
| What is the goal? | "Check repo health and summarize risk." |
| What can it access? | "Current repo files, read-only." |
| What actions can it take? | "Read package.json, inspect git status, count TODOs." |
| How does it know it is done? | "All checks completed and summary generated." |
| When must it stop? | "After 5 attempts or timeout." |

Use `requiresApproval: true` on any action that writes files, sends messages, calls external systems, or changes production-like resources.

## Commands

| Command | What it does |
|---|---|
| `npm run loop:hello` | Runs the simplest learning loop |
| `npm run loop:repo-health` | Runs a read-only health check on this repo |
| `npm run loop <name>` | Runs `loops/<name>/loop.js` |
| `npm run new-loop <name>` | Creates a new loop folder from `loops/_template` |
| `npm test` | Runs unit tests for the loop runner |
| `npm run verify` | Checks syntax, runs tests, and runs examples |

## Scheduling

The loops are standalone. Run them manually, from cron, from a macOS LaunchAgent, from GitHub Actions, or from another daemon like Hoot.

Example cron entry for an hourly repo health check:

```cron
0 * * * * cd /Users/greggcochran/agentic-loops && npm run loop:repo-health
```

---

🐙 Created with 💜 by [@DUBSOpenHub] with the GitHub Copilot CLI.
