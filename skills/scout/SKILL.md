---
name: scout
description: "Frontend migration intelligence. Analyzes any frontend git repository (local path or GitHub URL) — React, Vue, Angular, Svelte, Next.js, Nuxt, etc. — to explain what the app is, its tech stack, and architecture. Primary focus: frontend. Handles private repos and monorepos. First step in an AI-assisted frontend migration workflow. Triggers on: scout, analyze repo, what is this project, frontend, tech stack, migration."
user-invocable: true
argument-hint: "[command] [path|url]"
license: MIT
metadata:
  author: egorsasin
  version: "1.1.0"
  category: migration
---

# Scout: Frontend Migration Intelligence

**Invocation:** `/scout [command] [path|url]`

Scouts any frontend git repository — including private repos and monorepos — and
produces a clear picture of what the app is, its frontend stack, and its component
architecture. Primary focus is frontend (React, Vue, Angular, Svelte, etc.).
Backend and infra are noted briefly as secondary context.

## Commands

| Command | What it does |
|---------|-------------|
| `/scout <path\|url>` | Full analysis: purpose + stack + architecture (chat output) |
| `/scout stack <path\|url>` | Tech stack only |
| `/scout arch <path\|url>` | Architecture and structure only |
| `/scout doc <path\|url>` | Generate full migration documentation → writes `scout-context/` to disk |
| `/scout compat` | Map current dependencies to target equivalents → writes `scout-context/target-stack.md` |

## Routing Logic

Parse the first argument:
- If it's `doc` → load sub-skill `scout-doc`, pass remaining args
- If it's `stack` → load sub-skill `scout-stack`, pass remaining args
- If it's `arch` → load sub-skill `scout-arch`, pass remaining args
- If it's `compat` → load sub-skill `scout-compat`, pass remaining args
- Otherwise treat the first argument as the path/URL → run full analysis

## Full Analysis Process

### Step 1 — Resolve the repo

Run `node scripts/clone_repo.mjs <url-or-path>` and parse the JSON output:

```json
{ "path": "/tmp/scout-abc", "is_temp": true, "repo": "user/repo", "auth_method": "gh", "error": null }
```

- If `error` is set: show the error and stop. Include the auth troubleshooting hint from the error message.
- If `is_temp` is true: note in the final report that a shallow clone was made to `path`.
- Proceed with the local `path`.

### Step 2 — Detect monorepo

Run `node scripts/detect_monorepo.mjs <path>` and parse the JSON output:

```json
{
  "is_monorepo": true,
  "tool": "turborepo",
  "apps": [{ "name": "web", "path": "apps/web", "type": "app" }],
  "libs": [{ "name": "@acme/ui", "path": "packages/ui", "type": "lib" }]
}
```

**If `is_monorepo` is true:**

Ask the user to choose a scope:

> "This is a **{tool}** monorepo with **{N} apps** and **{M} libs**. What do you want to analyze?"
>
> Options (present as a numbered list):
> 1. **Everything** — full monorepo overview (all apps + all libs)
> 2. **Specific app** — list each app by name and path
> 3. **Specific lib** — list each lib by name and path

Wait for the user's choice. Then:
- If "Everything": keep `analysis_path = path` (repo root)
- If specific app or lib: set `analysis_path = join(path, selected.path)`

**If `is_monorepo` is false:** `analysis_path = path` (use repo root directly)

### Step 3 — Spawn agents in parallel

Spawn all three agents at once, passing `analysis_path` as the target:

- `scout-docs` — reads README, docs, CHANGELOG in `analysis_path` to understand purpose
- `scout-stack` — detects languages, frameworks, and dependencies in `analysis_path`
- `scout-arch` — maps directory structure and identifies architectural patterns in `analysis_path`

### Step 4 — Synthesize

Combine agent results into a single structured report.

## Output Format

```
## What is this?
<2-3 sentence plain-language description. If monorepo + specific scope was chosen,
describe that scope specifically, then briefly note it's part of a {tool} monorepo.>

## Frontend Stack
| Layer            | Technology                        |
|------------------|-----------------------------------|
| Language         | TypeScript 5.x                    |
| Framework        | React 18                          |
| Meta-framework   | Next.js 14 (App Router)           |
| State            | Zustand / TanStack Query          |
| Styling          | Tailwind CSS v3 + CSS Modules     |
| UI Library       | shadcn/ui (Radix UI)              |
| Build tool       | Vite 5                            |
| Routing          | File-system (App Router)          |
| Data fetching    | TanStack Query + tRPC             |
| Forms            | React Hook Form + Zod             |
| Testing          | Vitest + Playwright               |
| Package manager  | pnpm                              |

## Architecture
**Rendering**: SSR + RSC (Next.js App Router)
**Components**: Feature-Sliced Design
**Routes**: 14 routes, nested layouts

**Key directories**:
- `app/` — Next.js routes and layouts
- `src/features/` — feature modules (UI + logic co-located)
- `src/components/ui/` — base UI components
- `src/hooks/` — shared custom hooks
- `src/stores/` — global state

## Migration Signals
<!-- Ordered by severity: high → medium → low -->
| Severity | Signal | What it means |
|----------|--------|---------------|
| 🔴 High | `pages/` dir alongside `app/` | Partial App Router migration — finish or roll back |
| 🟡 Medium | 3 class components in `src/features/` | Migrate to function components + hooks |
| 🟢 Low | `webpack.config.js` present | Consider Vite migration |

## Backend & Infra (secondary)
<One paragraph only. e.g.: "Co-located tRPC API in src/server/. Deployed to Vercel.
PostgreSQL via Prisma. Not analyzed in detail — frontend-focused scout.">

---
*Cloned from: github.com/user/repo (shallow, temp: /tmp/scout-abc)*   ← only if is_temp
*Monorepo: turborepo — analyzed scope: apps/web*                       ← only if monorepo
```

## Error Handling

| Scenario | Action |
|----------|--------|
| `clone_repo.mjs` returns error | Show the full error message including auth hints. Do not proceed. |
| Not a git repository | Proceed with analysis anyway — may still have useful structure. |
| Monorepo with no detected apps/libs | Report `is_monorepo: true` and tool name, then analyze root. |
| Empty or near-empty repo | Report what was found. Note it appears to be a skeleton/starter. |
| Agent returns no results | Include a note in that section that data was unavailable. |
