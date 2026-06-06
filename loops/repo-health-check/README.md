# repo-health-check

A read-only loop that inspects a repository and summarizes basic health signals.

It checks:

- `package.json` scripts
- git status
- TODO/FIXME count

```bash
npm run loop:repo-health
npm run loop repo-health-check -- --target /path/to/repo
```
