---
name: migrate
description: "Phase 2 of the migration workflow. Requires .scout/context/ from /scout doc. Target stack is set once via /migrate init and persists across all sub-commands. Sub-commands: init (set target), compat (dependency mapping), plan (migration plan), diff (compare progress), risk (effort scoring). Triggers on: migrate, migration plan, target stack, what to replace, plan the migration."
user-invocable: true
argument-hint: "<command> [args]"
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Migrate: Migration Planning & Execution

**Invocation:** `/migrate <command> [args]`

Phase 2 of the migration workflow. Reads `.scout/context/` produced by `/scout doc`
and a confirmed target stack from `.scout/migration/target.md`.

## Migration workflow

```
/scout doc <url>         Phase 1 — document current state (stack-agnostic)
       ↓
/migrate init <target>   Phase 2 — set target stack once → .scout/migration/target.md
       ↓
/migrate compat          Map current deps to target equivalents → .scout/migration/compat.md
       ↓
/migrate plan            Generate phased migration plan → .scout/migration/plan.md
       ↓
/migrate execute         Execute plan phase by phase → .scout/migration/progress.md
       ↓
/migrate diff            (coming soon) Compare progress to plan
/migrate risk            (coming soon) Effort and risk scoring
```

## Commands

| Command | What it does |
| --- | --- |
| `/migrate init <target>` | Set target stack once. Saves `.scout/migration/target.md`. |
| `/migrate compat` | Map dependencies: current → target. Reads `.scout/migration/target.md`. Saves `.scout/migration/compat.md`. |
| `/migrate plan` | Generate phased migration plan. Reads both `.scout/migration/target.md` and `.scout/migration/compat.md`. Saves `.scout/migration/plan.md`. |
| `/migrate execute` | Execute plan phase by phase. Tracks progress in `.scout/migration/progress.md`. |
| `/migrate diff` | Compare current state to migration plan. *(coming soon)* |
| `/migrate risk` | Score migration effort and risk. *(coming soon)* |

## Routing

Parse the first argument:

- `init` → run **Init** flow below
- `compat` → load sub-skill `migrate-compat`
- `plan` → load sub-skill `migrate-plan`
- `execute` → load sub-skill `migrate-execute`
- `diff` → respond: "Coming soon. Complete /migrate plan first."
- `risk` → respond: "Coming soon. Complete /migrate plan first."
- No argument or unknown → show the workflow diagram and command table above

## Guard: check prerequisites

Before running any command except `init`:

1. Check `.scout/migration/target.md` exists in the current directory.
   If not: stop with — "`.scout/migration/target.md` not found. Run `/migrate init <target>` first."

2. Check `.scout/context/02-tech-stack.md` exists.
   If not: stop with — "`.scout/context/` not found. Run `/scout doc <url>` first."

---

## Init flow

**Command:** `/migrate init <target>`

`<target>` is the user's description of the target stack — free text is fine:
"Next.js 15", "Nuxt 4 + Pinia + shadcn-vue", "SvelteKit 2 + Tailwind".

### Step 1 — Parse target

Extract from the user-provided string:
- **Meta-framework** (required): Next.js / Nuxt / SvelteKit / Remix / Astro / Vite SPA / other
- **Language**: TypeScript (default) / JavaScript
- **Additional constraints** if mentioned (e.g. specific UI lib, state manager)

If the user provided no argument or just `/migrate init` with nothing:
Ask: "What's the target stack? (e.g. Next.js 15, Nuxt 4, SvelteKit 2 + Tailwind)"
Wait for the answer.

### Step 2 — Confirm

Show a one-line summary:
> Target: **{meta-framework}** · Language: **{language}**{extra constraints if any}
> Is this right? (yes / adjust)

Wait for confirmation. If the user adjusts, update and re-confirm.

### Step 3 — Create .scout/migration/ and write target.md

Create `.scout/migration/` in the current working directory.

Write `.scout/migration/target.md`:

```markdown
# Migration Target

> Set via /migrate init

## Target stack

| Field | Value |
| --- | --- |
| Meta-framework | {e.g. Next.js 15 (App Router)} |
| Language | {TypeScript / JavaScript} |
| Raw input | {the user's original string} |

## Additional constraints

{Any extra constraints the user specified, e.g. "must use shadcn/ui", "keep Redux".
Leave empty if none.}
```

### Step 4 — Done

```
✓ Target saved to .scout/migration/target.md

  Next steps:
  /migrate compat   — map current dependencies to target equivalents
  /migrate plan     — generate migration plan (after compat)
```
