# Claude Scout

A Claude Code skill that analyzes any git repository and explains what the application is, its tech stack, and its architecture.

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

# Full repo analysis
/scout https://github.com/user/project

# Generate full migration documentation (context)
/scout doc https://github.com/user/project
```

## Commands

| Command                           | Description                                            |
| --------------------------------- | ------------------------------------------------------ |
| `/scout <path\|github-url>`       | Full analysis: what it is + stack + architecture       |
| `/scout stack <path\|github-url>` | Tech stack only                                        |
| `/scout arch <path\|github-url>`  | Architecture and structure only                        |
| `/scout doc <path\|github-url>`   | Generate full migration documentation → scout-context/ |

### Examples

```
/scout ./my-app
/scout https://github.com/vercel/next.js
/scout stack https://github.com/vuejs/vue
/scout doc ~/projects/dashboard
```

### `/scout doc` output

Running `/scout doc` writes a `scout-context/` directory in your current folder:

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

- `/scout plan` — generate a migration plan
- `/scout diff` — compare before/after states of a project
- `/scout risk` — score migration effort and risk
- `/scout compat` — check dependency compatibility for a target version
