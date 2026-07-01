# Claude Scout: Frontend Migration Intelligence Skill

## Project Overview

Claude Scout is a Claude Code skill for AI-assisted **frontend migration**.
Primary focus: React, Vue, Angular, Next.js, Nuxt and the
full frontend ecosystem (state, styling, build tools, routing).
Backend and infra are supported as secondary context only.

It starts by scouting any git repository — explaining what the frontend app is,
its tech stack (framework, state, styling, UI library, build tool), and component
architecture — and grows into a full frontend migration assistant:
gap analysis, migration planning, and step-by-step execution guidance.

## Architecture

```
claude-scout/
  CLAUDE.md                     # Project instructions (this file)
  .claude-plugin/
    plugin.json                 # Plugin manifest
  skills/
    scout/
      SKILL.md                  # Phase 1 orchestrator — routing table
    scout-stack/
      SKILL.md                  # Tech stack detection sub-skill
    scout-arch/
      SKILL.md                  # Architecture and structure sub-skill
    scout-doc/
      SKILL.md                  # Migration documentation generator
    migrate/
      SKILL.md                  # Phase 2 orchestrator — init + routing
    migrate-compat/
      SKILL.md                  # Dependency mapping: current → target
    migrate-plan/
      SKILL.md                  # Phased migration plan generator
    migrate-execute/
      SKILL.md                  # Phase-by-phase execution with progress tracking
  agents/
    scout-docs.md               # Reads README/docs → 01-overview.md
    scout-stack.md              # Detects languages, frameworks → 02-tech-stack.md
    scout-arch.md               # Maps structure, patterns → 03-architecture.md
    scout-doc-components.md     # Component specs → 04-components/
    scout-doc-routes.md         # Route map → 05-routes.md
    scout-doc-state.md          # State management → 06-state.md
    scout-doc-api.md            # API layer → 07-api-layer.md
    migrate-task.md             # Implements a single migration task in target_dir
  scripts/
    clone_repo.mjs              # Clones GitHub URLs to a temp directory (Node.js ESM)
    detect_monorepo.mjs         # Detects monorepo tool and lists apps/libs (Node.js ESM)
```

## Commands

### Phase 1 — Documentation (stack-agnostic)

| Command | Purpose |
|---------|---------|
| `/scout <path\|url>` | Full repo analysis: what it is + stack + architecture (chat) |
| `/scout stack <path\|url>` | Tech stack only |
| `/scout arch <path\|url>` | Directory structure and architecture pattern only |
| `/scout doc <path\|url>` | Generate full migration documentation → writes `.scout/context/` |

### Phase 2 — Migration (target-stack bound)

| Command | Purpose |
|---------|---------|
| `/migrate init <target>` | Set target stack once → writes `.scout/migration/target.md` |
| `/migrate compat` | Map current deps to target equivalents → writes `.scout/migration/compat.md` |
| `/migrate plan` | Generate phased migration plan → writes `.scout/migration/plan.md` |
| `/migrate execute` | Execute plan phase by phase → tracks progress in `.scout/migration/progress.md` |
| `/migrate diff` | Compare progress to plan *(roadmap)* |
| `/migrate risk` | Score migration effort and risks *(roadmap)* |

## Migration workflow

```
Phase 1 (stack-agnostic)           Phase 2 (target-stack bound)
─────────────────────────          ─────────────────────────────────────────
/scout doc <url>              →    /migrate init <target>
  .scout/context/                     .scout/migration/target.md
  01-overview.md                         ↓
  02-tech-stack.md                   /migrate compat
  03-architecture.md                   .scout/migration/compat.md
  04-components/                         ↓
  05-routes.md                       /migrate plan
  06-state.md                          .scout/migration/plan.md
  07-api-layer.md                          ↓
  08-dependencies.md                   /migrate execute
  09-migration-signals.md                .scout/migration/progress.md
```

`.scout/context/` is reusable across multiple target stacks.
`.scout/migration/` is target-specific — one directory per migration target.

## Roadmap

- `/migrate diff` — compare current state to migration plan (progress tracking)
- `/migrate risk` — score migration effort and risk per phase

## Development Rules

- Keep SKILL.md files under 300 lines
- Each agent has one focused responsibility
- Scripts are written in **Node.js** (ESM `.mjs`), no external dependencies
- All scripts output JSON to stdout and exit 0 on success / 1 on error
- All commands support both local path and GitHub URL

## Security Rules

- `clone_repo.mjs` only accepts `github.com` URLs — no arbitrary hosts
- Clones use `--depth 1` — no full history needed for scouting
- Temp clones go to `/tmp/scout-*`
