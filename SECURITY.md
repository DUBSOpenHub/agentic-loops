# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting a vulnerability

Do not open a public GitHub issue for security vulnerabilities. Use GitHub private vulnerability reporting if available, or contact the repository owner through GitHub.

Please include:

- A description of the issue and potential impact.
- Steps to reproduce or a proof of concept.
- Whether the loop can write files, send messages, call external systems, or touch production-like resources.

## Security model

Agentic loops can become risky when they are allowed to act repeatedly. This repo keeps loops safe by default:

- Loops must be bounded by `maxAttempts`, `timeoutMs`, or an explicit done verdict.
- Risky actions require approval via `requiresApproval: true`.
- Example loops should be read-only unless write behavior is obvious from the name and README.
- Generated state and logs are local-only and ignored by git.
- Secrets belong in environment variables or a local `.env` file that is never committed.

## Known limitations

This repo provides local safety primitives, not a sandbox. A loop runs with the same filesystem and network permissions as the user who starts it. Review any new loop before running it against private data, external services, or production-like systems.
