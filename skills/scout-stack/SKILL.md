---
name: scout-stack
description: "Tech stack detection for a git repository. Identifies languages, frameworks, package managers, databases, infrastructure tools, and runtime versions. Use when user asks: what stack is this, what language, what framework."
user-invocable: true
argument-hint: "[path|url]"
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Scout Stack: Tech Stack Detection

**Invocation:** `/scout stack <path|url>`

Detects and reports the complete tech stack of a repository.

## Process

1. Resolve path (clone if GitHub URL via `node scripts/clone_repo.mjs <url>`)
2. Spawn `scout-stack` agent with the local path
3. Return structured tech stack report

## Output Format

```
## Tech Stack: <repo-name>

| Layer        | Technology           | Version   | Confidence |
|--------------|----------------------|-----------|------------|
| Language     | TypeScript           | 5.x       | High       |
| Runtime      | Node.js              | 20 LTS    | High       |
| Framework    | Next.js              | 14        | High       |
| Styling      | Tailwind CSS         | 3.x       | High       |
| Database     | PostgreSQL (via ORM) | —         | Medium     |
| ORM          | Prisma               | 5.x       | High       |
| Testing      | Vitest + Playwright  | —         | High       |
| Infra        | Docker, Vercel       | —         | Medium     |
| Package mgr  | pnpm                 | —         | High       |

### Detection Sources
- `package.json` → dependencies and scripts
- `tsconfig.json` → TypeScript config
- `docker-compose.yml` → infrastructure
- `.nvmrc` / `.node-version` → runtime pinning
```

## Confidence Levels

- **High**: File explicitly declares the dependency (package.json, go.mod, etc.)
- **Medium**: Inferred from usage patterns in source files
- **Low**: Guessed from directory names or README mentions only
