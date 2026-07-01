---
name: migrate-compat
description: "Dependency mapping for migration Phase 2. Reads scout-context/02-tech-stack.md and migration/target.md, proposes current→target replacement for each dependency category, iterates until user confirms, then writes migration/compat.md. Part of the /migrate workflow — called by /migrate compat."
user-invocable: false
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Migrate Compat: Dependency Mapping

Reads the current stack and the confirmed migration target, then produces a
dependency mapping (current → target) saved to `migration/compat.md`.

## Input

- `scout-context/02-tech-stack.md` — current stack (written by `/scout doc`)
- `migration/target.md` — target meta-framework and constraints (written by `/migrate init`)

---

## Process

### Step 1 — Read inputs

Read `scout-context/02-tech-stack.md` to extract the current stack.
Read `migration/target.md` to get the target meta-framework, language, and any
additional constraints the user specified at init time.

### Step 2 — Build the mapping table

For each category below, propose a target based on the confirmed meta-framework
and what works well with it. Honour any constraints from `migration/target.md`
(e.g. "must use shadcn/ui", "keep Redux") without question.

**Categories to map:**

| Category | Map if detected | Guidance |
| --- | --- | --- |
| Language | Always | TypeScript is the default target unless user said otherwise |
| Meta-framework | Always | Already set in migration/target.md |
| UI Library | If present | Prefer headless/accessible libs compatible with target |
| Client state | If present | Prefer minimal — check if server state tool covers most needs first |
| Server/async state | If present | TanStack Query v5 for React; VueUse + Pinia for Vue; native loaders for Remix/SvelteKit |
| Routing | If standalone | Usually replaced by meta-framework's built-in router |
| API layer | If present | Match to target's idioms (Server Actions, tRPC, REST, GraphQL) |
| Forms & validation | If present | React Hook Form + Zod for React; vee-validate or FormKit for Vue |
| Styling | If present | Tailwind CSS v4 by default; keep CSS Modules if already in use |
| Testing | If present | Vitest + Playwright for most JS targets |
| Auth | If present | Suggest ecosystem-native option (NextAuth v5, Nuxt Auth, Lucia) |
| Build tool | If standalone | Usually replaced by meta-framework's bundler |
| Package manager | Always | Keep current unless user requests a change |

**For each category, show:**
- Current (from `02-tech-stack.md`)
- Recommended target
- One-line rationale

### Step 3 — Present draft mapping

```
## Draft dependency mapping
Current stack → {target meta-framework}

| Category | Current | Target | Why |
| --- | --- | --- | --- |
| Language | JavaScript | TypeScript | Type safety; required by most modern tooling |
| Meta-framework | Create React App | Next.js 15 (App Router) | SSR/SSG/RSC, active ecosystem |
| UI Library | Ant Design 5 | shadcn/ui | Headless, accessible, copies into your codebase |
| Client state | Redux Toolkit | Zustand | 80% less boilerplate for same complexity |
| Server state | Redux Thunk | TanStack Query v5 | Caching, deduplication, background refetch |
| Routing | React Router 6 | App Router (built-in) | Eliminated — Next.js handles this |
| API layer | Axios | native fetch + TanStack Query | Smaller bundle; Query handles caching |
| Forms | Formik | React Hook Form + Zod | Faster, uncontrolled, schema-driven |
| Styling | styled-components | Tailwind CSS v4 | Utility-first; eliminates runtime CSS-in-JS |
| Testing | Jest + RTL | Vitest + Playwright | Faster, native ESM, same API |
| Auth | custom JWT | NextAuth v5 | Framework-native, provider library |
| Package manager | npm | pnpm | Disk efficiency, workspaces |

Does this mapping look right? Reply with any changes, or say "confirmed" to save.
```

### Step 4 — Iterate

If user suggests changes: update the row(s), re-show the full table, repeat.

### Step 5 — Write migration/compat.md

Once confirmed:

```markdown
# Dependency Mapping

> Confirmed via /migrate compat
> Source: scout-context/02-tech-stack.md + migration/target.md

## Mapping

| Category | Current | Target | Rationale |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Dropped (no equivalent needed)

- {e.g. React Router 6 — replaced by App Router built-in routing}
- {e.g. Webpack — replaced by Next.js/Turbopack}

## To evaluate later

- {e.g. Auth — depends on backend auth strategy; confirm with team}
- {e.g. i18n — not detected in current stack, confirm if needed}
```

### Step 6 — Done

```
✓ Dependency mapping saved to migration/compat.md

  Next: /migrate plan
```

---

## Decision guidance

**State management — when to drop client state:**
If target is Next.js App Router, Remix, or SvelteKit and current app uses
Redux/Vuex/MobX primarily for server data (API responses, session, lists):
propose TanStack Query only and note client state may not be needed.
Only suggest Zustand/Pinia/Jotai if the app has genuinely complex client-only
state (multi-step forms, UI orchestration, real-time features).

**UI library — prefer headless:**
shadcn/ui, Radix UI, Headless UI, Melt UI, Kobalte give full styling control.
Suggest over styled component libraries unless team is deeply invested or
design system requires it.

**Routing — check if it becomes redundant:**
React Router, Vue Router, Angular Router are often replaced by the
meta-framework's file-system router. Mark as "Dropped — replaced by
{meta-framework} built-in" rather than mapping to an equivalent.

**Styling — runtime vs build-time:**
styled-components, Emotion, CSS-in-JS with runtime overhead → suggest Tailwind CSS v4.
CSS Modules → suggest keeping (work fine in all target frameworks).

**"To evaluate later":**
Add entries for anything requiring info not in the code: auth strategy (backend),
i18n requirements, analytics, feature flags, payment integrations.
Don't invent mappings for these.
