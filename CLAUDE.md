# CLAUDE.md

Operating manual for the **Bayanluma 1 Elementary School Portal** (`bl1es-portal`).
Auto-loaded into every Claude Code session — keep it short and enforceable. Deeper rationale lives in `plan/`.

> **Status:** Planning phase. Nothing is scaffolded yet. Items marked _(open)_ are still being decided in `plan/technical-approach.md`.

## What this is

A web portal for a single public elementary school (DepEd, Philippines) serving two audiences from one app:

- **Teachers** — manage classes, grades, attendance, etc.
- **Students / parents / guardians** — view grades, attendance, announcements, etc.

## Stack (confirmed)

- **Language:** TypeScript (strict)
- **Build:** Vite
- **UI:** React
- **Styling:** Tailwind CSS; compose classNames with a `cn()` helper (`clsx` + `tailwind-merge`)
- **Server state:** TanStack Query — do not hand-roll `fetch`-in-`useEffect` for server data
- **HTTP client:** Axios (single shared instance — see API Layer below)
- **Architecture:** Single app, **role-based** access (teacher vs student/parent/guardian), **feature-oriented** folder structure
- **Testing:** Vitest + React Testing Library

## Infrastructure (planned)

- **Backend:** Supabase (Postgres + Auth + Row-Level Security)
- **Hosting:** Netlify (free tier)
- **Source control:** GitHub — PRs created/merged from Claude Code once tooling is wired up

## UI components _(open)_

Recommended: **shadcn/ui** (Radix + Tailwind, self-owned, themeable via CSS variables). Pending final confirmation alongside the design palette.

## Design

**Strictly follow the design concept/theme established in `design-system/`.** Don't improvise colors,
spacing, or component styling outside it — if something's missing from the design system, flag it
and extend the design system first, rather than deciding ad hoc in a component.

## Project structure

Feature-oriented. Anything specific to one feature lives inside that feature; anything shared across
features lives in top-level `src/`.

```
src/
  features/
    auth/
      pages/        route-level screens for this feature
      components/   components used only within this feature
      hooks/        hooks used only within this feature (incl. React Query hooks)
      api/          API functions for this feature (see API Layer below)
    <other-feature>/
      pages/ components/ hooks/ api/
  components/
    ui/              shadcn/ui primitives (generated, treat as owned)
    <shared composites, e.g. AppShell, PageHeader>
  hooks/             hooks shared across 2+ features
  lib/
    api-client.ts    the single shared Axios instance (baseURL, interceptors)
    query-client.ts  TanStack Query client setup
    utils.ts         cn() and other framework-agnostic helpers
  routes/            route/router configuration, wiring feature pages together by role
  styles/
    globals.css      Tailwind directives + design-system CSS variables (theme tokens)
  types/             types shared across 2+ features
```

**Rule of thumb:** if it's used by exactly one feature, it lives inside that feature. The moment a
second feature needs it, promote it to the matching top-level `src/` folder (`components/`, `hooks/`,
`types/`).

## API layer

Data flow is a strict one-way pipeline — never skip a layer:

```
Component → React Query hook (feature/hooks) → API function (feature/api) → Axios instance (src/lib)
```

- **`src/lib/api-client.ts`** — the *only* place Axios is instantiated. Base URL, headers,
  interceptors (auth token attach, error normalization) live here. Nothing outside this file calls
  `axios` directly.
- **`features/<feature>/api/*.ts`** — one function per request. Typed request/response, calls the
  shared Axios instance, throws/returns — no React or React Query in this layer.
- **`features/<feature>/hooks/*.ts`** — wraps an API function in `useQuery`/`useMutation`. This is
  the *only* layer components talk to for server data.

### Template — API function (`features/<feature>/api/get-profile.ts`)

```ts
import { apiClient } from '@/lib/api-client';

export interface Profile {
  id: string;
  role: 'teacher' | 'parent' | 'student';
  fullName: string;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>('/profile');
  return data;
}
```

### Template — `useQuery` hook (`features/<feature>/hooks/use-profile.ts`)

```ts
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/get-profile';

export function useProfile() {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: getProfile,
  });
}
```

### Template — `useMutation` hook (`features/<feature>/hooks/use-login.ts`)

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '../api/login';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });
}
```

**Query key convention:** always an array starting with the feature name, e.g. `['auth', 'profile']`,
`['grades', studentId]`. Prevents collisions and keeps invalidation scoped and predictable.

## Repository map

- `CLAUDE.md` — this file; the always-loaded operating manual.
- `plan/` — technical approach (Part 1) + point-in-time implementation plans.
- `specs/` — business rules and API contracts (Part 2). Living docs.
- `design-system/` — palette, design tokens, typography, component conventions.
- `.claude/skills/` — project-scoped skills.

## Working agreements

- **Design before code.** Capture rules in `specs/`, plan in `plan/`, then implement.
- **Prefer free / open-source tools** — this is a personal project.
- Push back with better ideas when you have them; don't agree by default.

## Conventions _(expanding)_

Project structure and API layer conventions are above. Remaining conventions (naming, test
placement, commit/PR rules) will be finalized in `plan/technical-approach.md` and distilled here as
they solidify.
