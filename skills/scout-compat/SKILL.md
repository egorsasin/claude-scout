---
name: scout-compat
description: "Maps current dependencies to target-stack equivalents. Reads scout-context/02-tech-stack.md, asks for target meta-framework, proposes replacement for each dependency category, waits for user confirmation, then writes scout-context/target-stack.md. Run before /scout plan. Triggers on: scout compat, target stack, dependency mapping, what to replace, migration stack."
user-invocable: true
argument-hint: "[scout-context path]"
license: MIT
metadata:
  author: egorsasin
  version: "1.0.0"
  category: migration
---

# Scout Compat: Dependency Mapping

**Invocation:** `/scout compat [scout-context-path]`

Reads the current stack from `scout-context/` and produces a confirmed
dependency mapping — current → target — saved as `scout-context/target-stack.md`.
This file is consumed by `/scout plan` to generate concrete, actionable tasks.

## Prerequisites

`scout-context/02-tech-stack.md` must exist. If not:
> "`scout-context/` not found. Run `/scout doc <path|url>` first."

---

## Process

### Step 1 — Locate scout-context

Default: look for `scout-context/` in the current working directory.
If a path argument was passed: use that as the `scout-context/` directory.
Read `02-tech-stack.md` and extract the current stack.

### Step 2 — Ask for migration target

Present current meta-framework and ask:

> **What's the target meta-framework?**
>
> Current: `{detected meta-framework or "none"}`
>
> Common options:
> - Next.js 15 (App Router)
> - Nuxt 4
> - SvelteKit 2
> - Remix v2 / React Router v7
> - Astro 5
> - Vite SPA (no meta-framework)
> - Same as current — upgrade only
> - Other (specify)

Wait for the user's answer before proceeding.

### Step 3 — Build the mapping table

For each category below, propose a target based on the chosen meta-framework
and what works well with it. Use your knowledge of the current ecosystem.

**Categories to map:**

| Category | Map if detected | Guidance |
| --- | --- | --- |
| Language | Always | TypeScript is the default target unless user says otherwise |
| Meta-framework | Always | Already answered in Step 2 |
| UI Library | If present | Prefer headless/accessible libraries compatible with target framework |
| Client state | If present | Prefer minimal — check if server state tool covers most needs first |
| Server/async state | If present | TanStack Query v5 for React; VueUse/Pinia for Vue; native loaders for Remix/SvelteKit |
| Routing | If standalone | Usually replaced by meta-framework's built-in router |
| API layer | If present | Match to target's idioms (Server Actions, tRPC, REST, GraphQL) |
| Forms & validation | If present | React Hook Form + Zod for React targets; vee-validate or FormKit for Vue |
| Styling | If present | Tailwind CSS v4 as default suggestion; keep CSS Modules if project uses them |
| Testing | If present | Vitest + Playwright for most JS targets |
| Auth | If present | Suggest ecosystem-native option (NextAuth v5, Nuxt Auth, Lucia) |
| Build tool | If standalone | Usually replaced by meta-framework's bundler |
| Package manager | Always | Keep current unless user requests a change |

**For each category, show:**
- What's current (from `02-tech-stack.md`)
- What you recommend for the target
- A one-line rationale

### Step 4 — Present the draft mapping

Show the full table for review:

```
## Draft dependency mapping: {CurrentStack} → {TargetMetaFramework}

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

### Step 5 — Iterate if needed

If the user suggests changes:
- Update the specific row(s)
- Re-show the full table
- Repeat until confirmed

### Step 6 — Write target-stack.md

Once confirmed, write `scout-context/target-stack.md`:

```markdown
# Target Stack

> Confirmed via /scout compat
> Source: scout-context/02-tech-stack.md

## Migration target

**Meta-framework:** {target}
**Language:** {target language}

## Dependency mapping

| Category | Current | Target | Rationale |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Dropped (no equivalent needed)

- {e.g. React Router 6 — replaced by App Router built-in routing}
- {e.g. Webpack — replaced by Next.js/Turbopack build pipeline}

## To evaluate later

- {e.g. Auth library — depends on backend auth strategy; confirm with backend team}
- {e.g. i18n — not detected in current stack, confirm if needed for target}
```

### Step 7 — Done

```
✓ Target stack saved to scout-context/target-stack.md

  Next: /scout plan
```

---

## Decision guidance (embedded knowledge)

Use these rules when proposing replacements — do not override the user's explicit choice.

**State management — when to drop client state entirely:**
If the target is Next.js App Router, Remix, or SvelteKit and the current app uses
Redux/Vuex/MobX primarily for server data (user session, API responses, lists):
propose replacing with TanStack Query only and note that client state may not be
needed. Only suggest Zustand/Pinia/Jotai if the app has genuinely complex
client-only state (multi-step forms, UI orchestration, real-time features).

**UI library — prefer headless:**
Headless libraries (shadcn/ui, Radix UI, Headless UI, Melt UI, Kobalte) give
full styling control. Suggest them over styled component libraries unless the
team is already deeply invested in a specific library or the design system
requires it.

**Routing — check if it becomes redundant:**
React Router, Vue Router, Angular Router are often replaced by the
meta-framework's file-system router. Mark them as "Dropped — replaced by
{meta-framework} built-in" instead of mapping to an equivalent.

**Styling — runtime vs build-time:**
If the current stack uses styled-components, Emotion, or CSS-in-JS with runtime
overhead, Tailwind CSS v4 is the recommended target. If the team uses CSS
Modules, suggest keeping them (CSS Modules work fine in all target frameworks).

**"To evaluate later":**
Add entries for anything that requires information you don't have from the code
alone: auth strategy (depends on backend), i18n requirements, analytics,
feature flags, payment integrations. Don't invent a mapping for these.
