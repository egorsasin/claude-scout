# Claude Scout

A Claude Code skill that analyzes any git repository and plans its migration — documenting the current state and generating a concrete, phased migration plan to a target stack.

---

## Requirements

- [Claude Code](https://claude.ai/code) (CLI or VS Code extension)
- Node.js 18+
- Git
- `gh` CLI (optional, for private repos) — [install](https://cli.github.com)

---

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/egorsasin/claude-scout/main/install.sh | bash
```

No `npm install` needed — scripts use only Node.js built-ins.

---

## Quick start

```bash
# Start Claude Code
claude

# Quick analysis (chat output only)
/scout https://github.com/user/project

# Full migration workflow:

# Phase 1 — document the current project (no target stack needed)
/scout doc https://github.com/user/project

# Phase 2 — plan the migration to a specific stack
/migrate init "Next.js 15 App Router + Tailwind + Zustand"
/migrate compat
/migrate plan
```

---

## Commands

### Phase 1 — `/scout` (stack-agnostic documentation)

| Command | Description |
| --- | --- |
| `/scout <path\|url>` | Full analysis: what it is + stack + architecture |
| `/scout stack <path\|url>` | Tech stack only |
| `/scout arch <path\|url>` | Architecture and structure only |
| `/scout doc <path\|url>` | Generate full migration documentation → `scout-context/` |

### Phase 2 — `/migrate` (target-stack bound)

| Command | Description |
| --- | --- |
| `/migrate init <target>` | Set target stack once → `migration/target.md` |
| `/migrate compat` | Map current deps to target equivalents → `migration/compat.md` |
| `/migrate plan` | Generate phased migration plan → `migration/plan.md` |

### Examples

```
/scout ./my-app
/scout https://github.com/vercel/next.js
/scout stack https://github.com/vuejs/vue
/scout doc ~/projects/dashboard

/migrate init "Nuxt 4 + Pinia + shadcn-vue"
/migrate compat
/migrate plan
```

---

## Output

### `/scout doc` → `scout-context/`

Stack-agnostic documentation of the current project. Reusable for any target stack.

```
scout-context/
  MIGRATION-CONTEXT.md        ← master document with summary and index
  01-overview.md              ← what the app is and who it's for
  02-tech-stack.md            ← full tech stack with versions
  03-architecture.md          ← component pattern, rendering, state topology
  04-components/              ← one spec file per component
    _index.md                 ← inventory: widgets · component cards · primitives
    widgets/                  ← Widget specs (own state + call APIs)
    components/               ← Component cards (leaf with behavior/variants)
    ui-primitives.md          ← all simple presentational components
  05-routes.md                ← full route map with guards and data loading
  06-state.md                 ← stores, state shape, actions, consumers
  07-api-layer.md             ← all API calls, endpoints, request/response types
  08-dependencies.md          ← package audit with outdated/risk flags
  09-migration-signals.md     ← prioritized checklist of what needs to change
```

### `/migrate` → `migration/`

Target-specific migration artifacts.

```
migration/
  target.md                   ← confirmed target stack (set once via /migrate init)
  compat.md                   ← dependency mapping: current → target
  plan.md                     ← phased migration plan with tasks and effort estimates
```

---

## Private repos

Scout tries three auth methods automatically, in order:

1. **`gh` CLI** — if installed and authenticated (`gh auth login`), works out of the box
2. **`GITHUB_TOKEN`** — set the env var with a [personal access token](https://github.com/settings/tokens)
3. **SSH / credential helper** — if your git is already configured for the repo

If all three fail, Scout shows a clear error with instructions.

---

## Monorepo support

When Scout detects a monorepo (Nx, Turborepo, pnpm workspaces, etc.), it lists all apps and libs and asks you to choose a scope:

```
This is a turborepo monorepo with 3 apps and 5 libs. What do you want to analyze?
  1. Everything — full overview
  2. Specific app: web (apps/web) · api (apps/api) · docs (apps/docs)
  3. Specific lib: @acme/ui (packages/ui) · @acme/utils (packages/utils)
```

---

## Roadmap

- `/migrate diff` — compare current state to migration plan (progress tracking)
- `/migrate risk` — score migration effort and risk per phase
