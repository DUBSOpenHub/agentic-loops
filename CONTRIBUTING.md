# Contributing to Agentic Loops

Thanks for your interest in contributing. This repo is a library of small, standalone loops that are safe to inspect, copy, and run.

## Dev environment setup

```bash
git clone https://github.com/DUBSOpenHub/agentic-loops.git
cd agentic-loops
npm install
```

## Running checks

```bash
npm run verify
```

## Creating a loop

```bash
npm run new-loop my-loop
npm run loop my-loop
```

## Loop checklist

Before opening a pull request, make sure:

- [ ] The loop has `maxAttempts` and `timeoutMs`.
- [ ] Risky actions use `requiresApproval: true`.
- [ ] Generated state stays under `state/` and generated logs stay under `logs/`.
- [ ] The loop has a short README with goal, safety notes, and run command.
- [ ] `npm run verify` passes.

## Branch naming

| Prefix | Use for |
|---|---|
| `feature/*` | New loops or shared capabilities |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation changes |
