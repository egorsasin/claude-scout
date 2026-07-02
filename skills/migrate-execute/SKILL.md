---
name: migrate-execute
description: "Executes the migration plan phase by phase. Reads .scout/migration/plan.md and tracks progress in .scout/migration/progress.md. Shows current phase status, marks tasks done, and requires user confirmation before advancing to the next phase. Triggers on: migrate execute, start migration, next task, mark done, migration progress."
user-invocable: false
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Migrate Execute: Phase-by-Phase Execution

Tracks progress through the migration plan. Each phase requires explicit user
confirmation before advancing.

## Commands

| Command | What it does |
| --- | --- |
| `/migrate execute [--target <path>]` | Show current phase and task list. On first run: sets target dir. |
| `/migrate execute done` | Mark the current open task as done; show next task |
| `/migrate execute done <task-text>` | Mark a specific task as done by matching text |
| `/migrate execute phase done` | Mark current phase done; confirm before advancing to next |
| `/migrate execute status` | Show progress summary across all phases |

## Input files

- `.scout/migration/plan.md` — the migration plan (source of truth for phases and tasks)
- `.scout/migration/progress.md` — current progress state (created on first run)

## Guard: check prerequisites

Check `.scout/migration/plan.md` exists.
If not: stop with — "`.scout/migration/plan.md` not found. Run `/migrate plan` first."

---

## Progress file format

`.scout/migration/progress.md` tracks which tasks are done. Created automatically
on first run if it does not exist.

```markdown
# Migration Progress

> Started: {date}
> Plan: .scout/migration/plan.md
> Target dir: {absolute path to the new app}

## Current phase: {N}

## Phase status

| Phase | Title | Status |
| --- | --- | --- |
| 0 | Foundation | done |
| 1 | Styling & UI primitives | in progress |
| 2 | Data layer | pending |
| 3 | App shell & layout | pending |
| 4 | Feature components & routes | pending |
| 5 | Testing & cleanup | pending |

## Completed tasks

<!-- One line per completed task. Format: Phase N · task short description -->
- Phase 0 · Scaffold {target} project
- Phase 0 · Configure ESLint + Prettier
- Phase 0 · Set up CI
- Phase 0 · Configure path alias @/*
- Phase 1 · Install & configure {UI library}
```

---

## Process

### On `/migrate execute` (show current phase)

1. Resolve `target_dir` (see Target directory section)
2. Read `plan.md` — extract all phases and their tasks
3. Read `progress.md` — get completed tasks and current phase
4. Find the current phase (first phase that is not `done`)
5. Display:

```
## Phase {N} — {Title}

Goal: {goal from plan}
Depends on: {dependencies}

Tasks:
  ✅ Scaffold {target} project
  ✅ Configure ESLint + Prettier
  ⬜ Set up CI (build + lint + type-check)      ← current open task
  ⬜ Configure path alias @/*
  ⬜ Decide hosting target

Progress: 2/5 tasks done

When a task is complete: /migrate execute done
When the whole phase is done: /migrate execute phase done
```

### On `/migrate execute` — implementing a task

After displaying the phase status, ask the user:
> "Implement the current task now? (yes / skip)"

If **yes**: extract `spec_path` (see **Spec path extraction** below), then spawn
agent `migrate-task` with:
- `task` — full text of the current open task (including Done when criterion)
- `target_dir` — from `progress.md`
- `spec_path` — extracted path(s), or empty string if none found
- `compat_path` — `.scout/migration/compat.md` (always pass; agent reads package versions from it)
- `phase_context` — the full phase section from `plan.md` for additional context

When the agent returns: show its report. Then ask:
> "Mark this task as done? (yes / no)"

If yes → same flow as `/migrate execute done`.

### On `/migrate execute done`

1. Find the first unchecked task in the current phase
2. Mark it as done in `progress.md`
3. Show updated task list
4. If all tasks in the phase are done — prompt:

```
✅ All tasks in Phase {N} — {Title} complete.

Ready to move to Phase {N+1} — {Title}?
Confirm with: /migrate execute phase done
```

### On `/migrate execute phase done`

1. Mark current phase as `done` in `progress.md`
2. Set next phase as `in progress`
3. Show the next phase task list (same format as `/migrate execute`)
4. If no next phase — show completion message:

```
🎉 All phases complete. Migration done.
Review: .scout/migration/progress.md
```

### On `/migrate execute status`

Show the phase summary table from `progress.md`:

```
Migration progress: {source} → {target}

| Phase | Title                        | Status      |
| ----- | ---------------------------- | ----------- |
| 0     | Foundation                   | ✅ done      |
| 1     | Styling & UI primitives      | 🔄 in progress (2/4) |
| 2     | Data layer                   | ⏳ pending   |
| 3     | App shell & layout           | ⏳ pending   |
| 4     | Feature components & routes  | ⏳ pending   |
| 5     | Testing & cleanup            | ⏳ pending   |
```

---

## Target directory

The target directory is where the new app will be scaffolded and built.

**Resolution order:**
1. `--target <path>` argument passed to the command
2. `target_dir` already stored in `progress.md` (set on a previous run)
3. Neither provided → ask the user:
   > "Where should the new app be created? (e.g. `../my-new-app` or `/Users/me/projects/app`)"
   > Wait for the answer.

Once resolved, store `target_dir` in `progress.md` and never ask again.
If the user passes `--target` and `progress.md` already has a different `target_dir`, confirm before overriding.

---

## Spec path extraction

Task text in `plan.md` may contain one or more references to spec files.
Extract them before spawning `migrate-task`.

**Patterns to scan for** (in order of priority):

| Pattern | Example in task text |
| --- | --- |
| `Spec: <path>` | `Spec: .scout/context/04-components/widgets/ItemDetailWidget.md` |
| `Spec: <path1>, <path2>` | `Spec: .scout/context/04-components/widgets/ItemListWidget.md`, `04-components/widgets/ItemSearchWidget.md` |
| `Ref: <path>` | `Ref: .scout/context/07-api-layer.md "Item Data Model"` |

**Extraction rules:**

1. Scan the full task text for `Spec:` or `Ref:` markers.
2. Collect all paths that follow (comma-separated if multiple).
3. Normalise: if a path starts with `.scout/` use as-is; if it starts with
   `04-components/` (no leading `.scout/context/`), prepend `.scout/context/`.
4. Verify each path exists with `Read`. If it does not exist, log a warning in
   the agent call but do not stop.
5. Pass as a newline-separated string if multiple:
   ```
   .scout/context/04-components/widgets/ItemListWidget.md
   .scout/context/04-components/widgets/ItemSearchWidget.md
   ```
6. If no `Spec:` or `Ref:` found → pass `spec_path` as empty string.

---

## First run (progress.md does not exist)

1. Resolve `target_dir` (argument → ask)
2. Parse all phases and tasks from `plan.md`
3. Create `progress.md` with `target_dir`, all phases set to `pending`, phase 0 `in progress`
4. Show Phase 0 task list
