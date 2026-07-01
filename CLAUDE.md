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
      SKILL.md                  # Main orchestrator — routing table
    scout-stack/
      SKILL.md                  # Tech stack detection sub-skill
    scout-arch/
      SKILL.md                  # Architecture and structure sub-skill
    scout-doc/
      SKILL.md                  # Migration documentation generator
    scout-compat/
      SKILL.md                  # Dependency mapping: current → target stack
  agents/
    scout-docs.md               # Reads README/docs → 01-overview.md
    scout-stack.md              # Detects languages, frameworks → 02-tech-stack.md
    scout-arch.md               # Maps structure, patterns → 03-architecture.md
    scout-doc-components.md     # Component specs → 04-components/
    scout-doc-routes.md         # Route map → 05-routes.md
    scout-doc-state.md          # State management → 06-state.md
    scout-doc-api.md            # API layer → 07-api-layer.md
  scripts/
    clone_repo.mjs              # Clones GitHub URLs to a temp directory (Node.js ESM)
    detect_monorepo.mjs         # Detects monorepo tool and lists apps/libs (Node.js ESM)
```

## Commands

| Command | Purpose |
|---------|---------|
| `/scout <path\|url>` | Full repo analysis: what it is + stack + architecture (chat) |
| `/scout stack <path\|url>` | Tech stack only |
| `/scout arch <path\|url>` | Directory structure and architecture pattern only |
| `/scout doc <path\|url>` | Generate full migration documentation → writes `scout-context/` to disk |
| `/scout compat` | Map current dependencies to target equivalents → writes `scout-context/target-stack.md` |

## Migration workflow

```
/scout doc <url>    →   /scout compat   →   /scout plan (coming soon)
   documents               maps deps             builds phased plan
   current state           current → target      from target-stack.md
```

## Roadmap (future sub-skills)

- `/scout plan` — generate phased migration plan from `scout-context/target-stack.md`
- `/scout diff <before> <after>` — compare two states of a frontend project
- `/scout risk` — score migration risks and estimate effort

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
