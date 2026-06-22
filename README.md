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
curl -fsSL https://raw.githubusercontent.com/esasin/claude-scout/main/install.sh | bash
```

No `npm install` needed — scripts use only Node.js built-ins.

---

## Usage

```
/scout <path|github-url>         Full analysis: what it is + stack + architecture
/scout stack <path|github-url>   Tech stack only
/scout arch <path|github-url>    Architecture and structure only
```

### Examples

```
/scout ./my-app
/scout https://github.com/vercel/next.js
/scout stack https://github.com/vuejs/vue
/scout arch ~/projects/dashboard
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
