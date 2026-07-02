---
name: migrate-plan
description: "Generates a phased migration plan from .scout/context/ and .scout/migration/compat.md. Reads current documentation (components, routes, state, API layer) and the confirmed dependency mapping, then produces a sequenced plan with phases, tasks, effort estimates, and risks. Writes .scout/migration/plan.md. Part of the /migrate workflow — called by /migrate plan."
user-invocable: false
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Migrate Plan: Migration Plan Generator

Reads `.scout/context/` and `.scout/migration/compat.md`, then produces a phased,
sequenced migration plan saved to `.scout/migration/plan.md`.

## Input

- `.scout/migration/target.md` — confirmed target stack
- `.scout/migration/compat.md` — confirmed dependency mapping
- `.scout/context/09-migration-signals.md` — prioritized issues from current codebase
- `.scout/context/04-components/_index.md` — component inventory with migration priority
- `.scout/context/05-routes.md` — route map
- `.scout/context/06-state.md` — state management documentation
- `.scout/context/07-api-layer.md` — API layer documentation
- `.scout/context/02-tech-stack.md` — current stack (versions, package manager)

---

## Process

### Step 1 — Read all inputs

Read every file listed above. Build a complete picture of:
- What exists now (components, routes, state, API)
- What needs to change (migration signals)
- What it changes to (compat mapping)
- What's highest priority (migration signals severity + component priority)

### Step 2 — Propose phase structure and wait for confirmation

Analyse the app and propose a phase structure. **Do not generate task details yet.**
Show the proposal and wait for the user to confirm or adjust.

**Guiding principles for the proposal:**

- **Vertical slices over horizontal layers**: do not create a full "Data layer" phase
  that builds all API clients, state, and hooks before any UI exists. Instead, build
  infrastructure foundations early, then grow API/state/tests alongside the features
  that consume them.
- **No orphaned code**: if an API method, state slice, or hook has no consumer yet,
  do not plan it. Plan it in the phase where its consumer (component/route) is built.
- **Infrastructure vs feature**: the only data-layer work that belongs in an early
  phase is shared infrastructure — HTTP client factory, Query provider setup, store
  shell, env vars. Specific endpoints and slices belong with their feature.
- **Route first within every feature slice**: the first task of any feature phase
  must create the page/route file (even as a placeholder). Every subsequent task in
  that slice renders into that route — so the developer can open the browser and see
  progress at each step. "Done when" for any component task must include a visual
  check: "visible at route X in `npm run dev`", not only unit tests.
- Omit phases that don't apply. Merge phases that are small or tightly coupled.
- Add phases for project-specific concerns if detected in `.scout/context/`.

**Present the proposal as:**

```
Proposed phase structure for {current} → {target}:

| # | Phase | Goal | Approach |
| --- | --- | --- | --- |
| 0 | Foundation | Scaffold, tooling, CI | — |
| 1 | Styling & primitives | Tailwind + shadcn/ui + utility fns | — |
| 2 | Infrastructure | HTTP client, Query provider, store shell, env | Shared foundations only — no feature-specific code |
| 3 | App shell | Root layout, nav, sidebar | — |
| 4 | Search feature | /book/find route + components + API + state + tests | Vertical slice |
| 5 | Book detail feature | /book/:id route + components + API + state + tests | Vertical slice |
| 6 | Collection feature | / route + components + persistence + state + tests | Vertical slice |
| 7 | Cleanup | Remove legacy, dead code, final polish | — |

Does this structure look right?
You can ask to merge phases, split a phase, reorder, or switch the approach for any phase.
Reply "confirmed" to generate the full detailed plan.
```

Wait for the user's response. If they request changes, update the table and re-present.
Repeat until confirmed.

### Step 3 — Break each phase into tasks

Only run this step after the phase structure is confirmed.

For each phase, list concrete tasks. Each task must:
- Be assignable to one developer
- Have a clear completion criterion
- Reference the specific file/component/route it touches

**Task format:**
```
- [ ] {verb} {what} — {file or component path if applicable}
      Effort: {S / M / L}   Risk: {Low / Medium / High}
      Done when: {specific, checkable outcome}
```

Effort scale: S = < 2h, M = 2h–1d, L = 1d–3d. Flag anything > L as needing breakdown.

### Step 4 — Add dependencies and risks

After the task list for each phase:

**Dependencies**: tasks that must complete before this phase can start.
**Risks**: what could go wrong, and the mitigation.

### Step 5 — Write .scout/migration/plan.md

```markdown
# Migration Plan

> Generated by /migrate plan
> {current meta-framework or "none"} → {target meta-framework}
> Source: .scout/context/ + .scout/migration/compat.md

## Summary

| Field | Value |
| --- | --- |
| Current stack | {e.g. Create React App + Redux + styled-components} |
| Target stack | {e.g. Next.js 15 App Router + Zustand + Tailwind CSS v4} |
| Total phases | {N} |
| Estimated effort | {e.g. 6–10 weeks, 1 developer} |
| Critical signals | {N from 09-migration-signals.md} |
| Components to migrate | {W widgets + C component cards} |
| Routes to migrate | {N routes} |

## Phases

---

### Phase 0 — Foundation

**Goal:** Working target framework skeleton with CI passing.
**Depends on:** Nothing — start here.

**Tasks:**
- [ ] Initialise Next.js 15 project with TypeScript and App Router
      Effort: S   Risk: Low
      Done when: `next dev` starts, TypeScript compiles with 0 errors
- [ ] Configure ESLint + Prettier matching existing rules
      Effort: S   Risk: Low
      Done when: `npm run lint` passes on empty project
- [ ] Set up CI pipeline (build + lint + type-check)
      Effort: M   Risk: Low
      Done when: CI passes on every PR
- [ ] Configure path aliases matching current `tsconfig.paths`
      Effort: S   Risk: Low
      Done when: `@/components/*` resolves correctly

**Risks:**
- Next.js 15 + Turbopack may conflict with some PostCSS plugins — test early.

---

### Phase 1 — Infrastructure

{tasks...}

---

...

## Migration signals carried over

| Severity | Signal | Addressed in phase |
| --- | --- | --- |
| 🔴 | {signal from 09-migration-signals.md} | Phase {N} |
| 🟡 | ... | ... |

## Component migration queue

Pulled from `04-components/_index.md`:

| Priority | Component | Type | Phase |
| --- | --- | --- | --- |
| 🔴 | {WidgetName} | Widget | Phase 5 |
| 🟡 | {ComponentName} | Component Card | Phase 5 |
| 🟢 | {PrimitiveName} | UI Primitive | Phase 4 |
```

### Step 6 — Done

```
✓ Migration plan written to .scout/migration/plan.md

  {N} phases · {total tasks} tasks · estimated {effort}

  Review the plan, then start with Phase 0.
```

---

## Scope rules

**In scope — include:**
- Application code (components, routes, state, API layer, utilities)
- Framework-native best practices for the target stack
- Testing (unit, integration, E2E)
- Developer tooling directly tied to the codebase (ESLint, Prettier, TypeScript config, path aliases)
- CI only for: build, lint, type-check, tests — i.e. code quality gates

**Out of scope — never include:**
- Hosting, deployment, or infrastructure (Vercel, AWS, Docker, CDN, DNS)
- DevOps, release pipelines, environment management
- Monitoring, logging infrastructure, analytics setup
- "Decide hosting target" — not a migration task
- Any task that would be identical regardless of what app is being migrated

If a task looks like DevOps or hosting, drop it entirely.

---

## Planning rules

**Independently deployable phases**: each phase ends with a working app.
Never plan a phase that leaves the app broken. If a dependency makes this
impossible (e.g. routing and components are tightly coupled), merge the phases.

**Highest-risk tasks first within a phase**: surface unknowns early so the
phase doesn't fail at the end.

**Don't plan the impossible**: if a widget has 3 API calls and 5 child
components, it belongs in Phase 5 as a single M/L task with its own sub-checklist
referenced from its spec file — not decomposed into 10 tasks in the plan.

**Reference component specs**: for each widget migration task, add:
`Spec: .scout/migration/components/widgets/{WidgetName}.md` so the developer knows
where to find the 1:1 specification.

**"To evaluate later" from compat.md**: include these as explicit placeholder
tasks in the relevant phase with `Risk: Unknown` and a note to investigate
before starting the phase.
