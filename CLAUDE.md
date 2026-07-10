# CLAUDE.md

Operating manual for the **Bayanluma 1 Elementary School Portal** (`bl1es-portal`).
Auto-loaded into every Claude Code session — keep it short and enforceable. Deeper rationale lives in `plan/`.

> **Status:** Iteration-1 planning complete (Kindergarten pilot). The app is scaffolded; the six
> iteration-1 specs live in `specs/` and the phased plan in `plan/roadmap.md`. Next phase:
> implementation (stand up Supabase + Netlify, then build starting with Auth & core entities).

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
- **Backend client:** Supabase JS (`@supabase/supabase-js`) — the single shared instance (see API Layer below)
- **Architecture:** Single app, **role-based** access (teacher vs student/parent/guardian), **feature-oriented** folder structure
- **Testing:** Vitest + React Testing Library

## Infrastructure (planned)

- **Backend:** Supabase (Postgres + Auth + Row-Level Security)
- **Hosting:** Netlify (free tier)
- **Source control:** GitHub — connected via the `gh` CLI; PRs created/merged from Claude Code per
  the `git-workflow` skill. (Supabase + Netlify are not stood up yet.)

## UI components

**shadcn/ui** (Radix + Tailwind, self-owned, themeable via CSS variables) — installed and in use.
Primitives live in `src/components/ui/` (treat as owned); theme tokens (palette, fonts) are in
`src/styles/globals.css`, per the design system.

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
    <shared composites, e.g. PageHeader>
  layouts/           page-shell components composing navigation chrome (sidebar, topbar) around
                     routed content — distinct from components/, which holds non-shell UI
  hooks/             hooks shared across 2+ features
  lib/
    supabase.ts      the single shared Supabase client (typed with generated Database)
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
Component → React Query hook (feature/hooks) → API function (feature/api) → Supabase client (src/lib/supabase.ts)
```

- **`src/lib/supabase.ts`** — the *only* place the Supabase client is created (URL + anon key,
  typed with the generated `Database`). Nothing outside this file constructs a client.
- **`features/<feature>/api/*.ts`** — one function per operation. Typed request/response, calls the
  shared `supabase` client (queries, auth, storage, RPC, `functions.invoke`), returns/throws — no
  React or React Query in this layer.
- **`features/<feature>/hooks/*.ts`** — wraps an API function in `useQuery`/`useMutation`. This is
  the *only* layer components talk to for server data.

### Template — API function (`features/<feature>/api/get-profile.ts`)

```ts
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  role: 'superadmin' | 'admin' | 'normal';
  fullName: string;
}

export async function getProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return { id: data.id, role: data.role, fullName: `${data.first_name} ${data.last_name}` };
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

## Security

Security is a **first-class priority** — non-negotiable, and it applies to every change (yours and
any sub-agent's):

- **Authorize at the database, never the client.** RLS is enabled on every table holding data and
  its policies enforce the role model. UI-level gating is UX, not security — the client is untrusted.
- **Guard columns, not just rows.** RLS grants access to a *row*, not specific *columns*. Protect
  privileged columns (`role`, `is_active`, identity fields, sensitive flags) with triggers/grants so
  a user can't self-escalate by updating their own row.
- **Least privilege, default deny.** Grant the narrowest access that works; writes to shared/config
  data are superadmin-only unless a spec says otherwise.
- **Secrets never touch the repo or chat.** Only the public anon/publishable key goes in client env
  (git-ignored `.env.local`). The `service_role` key, database password, and tokens stay local to
  the operator — never committed, never pasted into chat.
- **Security-sensitive changes get a human gate.** Anything touching auth, RLS, roles/permissions,
  or secrets is reviewed by the repo owner before it lands, and run past the `code-reviewer` agent
  for privilege-escalation / secret-leak / injection.
- **Don't roll your own auth or crypto.** Supabase Auth handles passwords, sessions, and tokens.
- **Minimize what a request/response carries.** Select only the columns a screen needs (never
  `select('*')`) — defense-in-depth on top of RLS, not a replacement for it. Sensitive data (passwords,
  tokens) goes in POST/PUT bodies only, never a GET query string (query strings land in server/proxy
  logs and browser history). Note: a request's own Payload/Response tab in the requester's own
  DevTools is expected to show plaintext — that's normal for any HTTPS login and isn't a leak; HTTPS
  is what protects it in transit.
- **Never log sensitive data.** No `console.log`/error-tracking capture of full request/response
  bodies or error objects that might embed a password or token.
- **Edge Functions carrying tokens/links** (e.g. the onboarding/reset-link function) set
  `Cache-Control: no-store` on their response.

## Repository map

- `CLAUDE.md` — this file; the always-loaded operating manual.
- `plan/` — `roadmap.md` (phased plan + deferred pipeline) + point-in-time implementation plans.
- `specs/` — business rules and API contracts (Part 2). Living docs.
- `design-system/` — palette, design tokens, typography, component conventions.
- `.claude/skills/` — project-scoped skills.

## Working agreements

- **Design before code.** Capture rules in `specs/`, plan in `plan/`, then implement.
- **Prefer free / open-source tools** — this is a personal project.
- Push back with better ideas when you have them; don't agree by default.
- **Senior-professional bar, everywhere.** The tech lead and every sub-agent in `.claude/agents/`
  operate at a professional, production-grade quality bar — no shortcuts, no guessed behavior. The
  tech lead verifies every sub-agent's output (build/test/browser) before it lands; an agent
  reporting "done" is never taken at face value.

## Conventions

Project structure and API layer conventions are above. Git workflow (branch → commit → PR → merge)
is defined in the `git-workflow` skill. Further conventions are distilled here as they solidify.
