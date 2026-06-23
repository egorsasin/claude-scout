---
name: scout-arch
description: "Architecture and structure analysis for a git repository. Identifies architectural patterns (MVC, microservices, monolith, serverless, etc.), maps key directories, and finds entry points. Use when user asks: what architecture, how is the code structured, how is this organized."
user-invocable: true
argument-hint: "[path|url]"
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Scout Arch: Architecture Analysis

**Invocation:** `/scout arch <path|url>`

Maps the architecture of a repository: structure, patterns, and entry points.

## Process

1. Resolve path (clone if GitHub URL via `node scripts/clone_repo.mjs <url>`)
2. Spawn `scout-arch` agent with the local path
3. Return structured architecture report

## Output Format

```
## Architecture: <repo-name>

**Pattern**: Monolith / MVC / Layered / Microservices / Serverless / ...

### Directory Map
```
<repo>/
  src/
    api/          ← REST/GraphQL handlers
    services/     ← Business logic
    models/       ← Data models / DB schemas
    utils/        ← Shared utilities
  tests/          ← Test suite
  docs/           ← Documentation
  infra/          ← Infrastructure as code
  scripts/        ← Dev/ops scripts
```

### Entry Points
| Type | File |
|------|------|
| Main server | `src/index.ts` |
| CLI | `cmd/main.go` |
| Worker | `workers/queue.ts` |

### Key Observations
- <anything unusual: circular deps, monorepo, generated code, etc.>
```

## Pattern Heuristics

| Signal | Pattern |
|--------|---------|
| `src/{controllers,models,views}` | MVC |
| `services/`, `packages/` at root | Microservices / Monorepo |
| `serverless.yml`, `functions/` | Serverless |
| Single `main.py` / `index.ts` + flat structure | Script / Small tool |
| `apps/`, `libs/` (nx/turborepo) | Monorepo |
| `cmd/`, `internal/`, `pkg/` | Go idiomatic structure |
