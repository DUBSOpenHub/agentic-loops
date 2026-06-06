# template-loop

Use this as the starting point for a new standalone loop.

## Goal

Describe the outcome this loop should produce.

## Safety

- Default access: read-only.
- Requires approval before writes, external messages, or production-impacting actions.
- Stops after the configured `maxAttempts`.

## Run

```bash
npm run loop template-loop
```
