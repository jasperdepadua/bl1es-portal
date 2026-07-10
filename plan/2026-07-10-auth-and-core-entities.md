# Auth & Core Entities — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the year-scoped core-entity schema with RLS, and replace the mock auth with real Supabase login so a seeded superadmin can sign in and reach role-gated routes.

**Architecture:** Supabase Postgres holds the entities from `specs/auth-and-core-entities.md`, with RLS enforcing the role model at the DB layer. The React app talks to Supabase via a single shared `supabase-js` client (`src/lib/supabase.ts`) — the sole backend client (Axios is removed). Login is by username (staff) or student number (student); the identifier is deterministically mapped to a **synthesized auth email** client-side, then `signInWithPassword`.

**Tech Stack:** Supabase (Postgres 17 + Auth + RLS), `@supabase/supabase-js`, React 19, TanStack Query, React Router, Vitest + RTL.

## Scope boundary

Delivers **schema + RLS + real login + first superadmin**. Does **not** build the
registration/invite flows for creating teachers/students (synthesized-email onboarding, custom
invite/reset delivery via Edge Function) — that's Management (sub-project 2). Here we only need one
superadmin (seeded, password set directly) to prove auth end-to-end.

## Global Constraints

- TypeScript strict; feature-oriented structure; follow `CLAUDE.md`.
- **Supabase is the only backend client** (`src/lib/supabase.ts`). Axios and `src/lib/api-client.ts`
  are removed.
- **RLS mandatory** on every table; authorization never trusted from the client.
- Data model is **exactly** `specs/auth-and-core-entities.md` § Data model.
- **Login mapping (client-side, deterministic, no lookup/RPC):** student-number format
  (`/^bl1es-\d{4}-\d{4}$/i`) → `{identifier}@students.bl1es.portal`; otherwise (username) →
  `{identifier}@staff.bl1es.portal`. (Usernames must be email-local-part-safe — enforced later at
  username generation in Management.)
- **Migrations apply to the linked (empty) cloud project** via `npx supabase db push` (DB password
  entered locally only). No local Docker stack.
- **No secrets committed.** `.env` git-ignored; only `.env.example` (no values) committed. The
  `anon` key goes in `.env` (`VITE_`-prefixed). The `service_role` key + DB password are used
  locally only, never committed, never in chat.
- Agents never run git; the tech lead lands via the `git-workflow` skill.

## File structure

- `src/lib/supabase.ts` — the shared `supabase-js` client (typed with `Database`).
- `src/types/database.ts` — generated DB types (do not hand-edit).
- `.env` (git-ignored) / `.env.example` (committed) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- `supabase/migrations/*_core_entities.sql` — tables + constraints + indexes.
- `supabase/migrations/*_rls.sql` — RLS helper functions + policies.
- `scripts/seed-superadmin.ts` — one-off admin-API script (run locally with the service key).
- `src/features/auth/api/{resolve-login-email,sign-in,sign-out,get-current-profile}.ts`.
- `src/features/auth/hooks/{use-auth.tsx,use-profile.ts,use-login.ts,use-logout.ts}`.
- `src/routes/require-auth.tsx`; `src/features/auth/pages/LoginPage.tsx`.
- Remove: `src/lib/api-client.ts`. Tests colocated (`*.test.ts(x)`).

---

### Task 1: Remove Axios, add Supabase client + env

**Files:** Modify `package.json`; delete `src/lib/api-client.ts`; create `src/lib/supabase.ts`, `.env`, `.env.example`; modify `.gitignore`, `CLAUDE.md`.

- [ ] **Step 1: Swap dependencies**

```bash
npm uninstall axios
npm install @supabase/supabase-js
rm src/lib/api-client.ts
```

- [ ] **Step 2: Get URL + anon key** (anon key is client-facing, not a secret)

```bash
npx supabase projects api-keys --project-ref kdzkydshyibxpquvjcjy   # copy the "anon" key
# URL: https://kdzkydshyibxpquvjcjy.supabase.co
```

- [ ] **Step 3: Ensure `.env` is git-ignored; create env files**

Confirm `.gitignore` matches `.env` (add a `.env` line if only `*.local` is present). Then:
`.env` (git-ignored): `VITE_SUPABASE_URL=...` + `VITE_SUPABASE_ANON_KEY=...` (real values).
`.env.example` (committed): the same two keys with empty values.

- [ ] **Step 4: Create the client**

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!url || !anonKey) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')

export const supabase = createClient<Database>(url, anonKey)
```

- [ ] **Step 5:** `CLAUDE.md`'s API-layer section is already Supabase-centric (updated in planning).
  Confirm nothing still imports `@/lib/api-client` (`grep -r api-client src`); there should be no
  hits.

- [ ] **Step 6: Verify** — `npm run build` fails only on the missing `@/types/database` import
  (created in Task 4). Expected until then; proceed.

---

### Task 2: Core entities migration (schema)

**Owner:** `db-engineer` (tech lead verifies). **Files:** `supabase/migrations/<ts>_core_entities.sql` via `npx supabase migration new core_entities`.

- [ ] **Step 1: Author the migration** implementing **every table** in
  `specs/auth-and-core-entities.md` § Data model, exactly. Tables: `profiles` (incl. `contact_email`),
  `student_details`, `school_years`, `grading_periods`, `grade_levels`, `subjects`,
  `grade_level_subjects`, `sections`, `enrollments`, `subject_assignments`.

  Non-obvious requirements (verbatim from spec):
  - Enums: `role ('superadmin','admin','normal')`; `shift ('AM','PM')` nullable;
    `enrollment_status ('enrolled','inactive')`.
  - `profiles.id` PK **references `auth.users(id)` on delete cascade**; `username` unique nullable;
    `contact_email` nullable.
  - `student_details.profile_id` PK/FK→profiles; `student_number` unique; `guardian_email` NOT NULL.
  - `school_years`: partial unique index for one current year —
    `create unique index on school_years (is_current) where is_current`.
  - Uniques: `grading_periods (school_year_id, sequence)`; `sections (grade_level_id, school_year_id, name)`;
    `enrollments (student_id, school_year_id)`; `subject_assignments (teacher_id, subject_id, section_id)`.
  - `is_active` default true where spec lists it; `created_at`/`updated_at` timestamptz default `now()`.
  - Indexes on all FK columns + `enrollments(section_id)`, `subject_assignments(section_id)`.

- [ ] **Step 2: Apply + verify** — `npx supabase db push` (enter DB password locally). Then
  `npx supabase db lint` is clean and `\d+` on each table shows the constraints. **Tech lead reviews
  the migration against the spec before it's considered done.**

---

### Task 3: RLS helper functions + policies

**Owner:** `db-engineer` (tech lead reviews closely — security core). **Files:** `supabase/migrations/<ts>_rls.sql`.

- [ ] **Step 1: Helper functions** (SECURITY DEFINER, so they bypass RLS and can't recurse):

```sql
create or replace function public.is_superadmin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'superadmin' and is_active);
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.can_access_section(section uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from sections s where s.id = section and s.adviser_id = auth.uid())
      or exists (select 1 from subject_assignments sa
                 where sa.section_id = section and sa.teacher_id = auth.uid() and sa.is_active);
$$;

create or replace function public.can_access_student(student uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from enrollments e
                 where e.student_id = student and public.can_access_section(e.section_id));
$$;
```

- [ ] **Step 2: Enable RLS on every table.**

```sql
alter table profiles, student_details, school_years, grading_periods, grade_levels,
             subjects, grade_level_subjects, sections, enrollments, subject_assignments
  enable row level security;
```

- [ ] **Step 3: Reference/config tables** (`school_years`, `grading_periods`, `grade_levels`,
  `subjects`, `grade_level_subjects`, `sections`) — readable by any authenticated user, writable by
  superadmin. Pattern (repeat per table):

```sql
create policy "read config" on sections for select to authenticated using (true);
create policy "superadmin writes config" on sections for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
```

- [ ] **Step 4: `profiles`**

```sql
create policy "read profiles" on profiles for select to authenticated using (
  id = auth.uid() or public.is_superadmin()
  or (public.is_admin() and role = 'normal' and public.can_access_student(id))
);
create policy "update own profile" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "superadmin manages profiles" on profiles for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
```

- [ ] **Step 5: `student_details`, `enrollments`, `subject_assignments`**

```sql
create policy "read student_details" on student_details for select to authenticated using (
  profile_id = auth.uid() or public.is_superadmin() or public.can_access_student(profile_id));
create policy "student updates own guardian info" on student_details for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "superadmin manages student_details" on student_details for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read enrollments" on enrollments for select to authenticated using (
  student_id = auth.uid() or public.is_superadmin() or public.can_access_section(section_id));
create policy "superadmin manages enrollments" on enrollments for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read subject_assignments" on subject_assignments for select to authenticated using (
  teacher_id = auth.uid() or public.is_superadmin());
create policy "superadmin manages subject_assignments" on subject_assignments for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());
```

- [ ] **Step 6: Apply + verify** (`npx supabase db push`). After the superadmin is seeded (Task 5),
  sanity-check: as superadmin, `select` on each table succeeds; scoped reads behave for other roles.
  Record results.

---

### Task 4: Generate TypeScript types

**Files:** `src/types/database.ts`.

- [ ] **Step 1:** After Tasks 2-3 are applied: `npx supabase gen types typescript --linked > src/types/database.ts`
- [ ] **Step 2: Verify** — `npm run build` now passes (the `@/types/database` import resolves).
  Commit generated file as-is (never hand-edit).

---

### Task 5: Seed the first superadmin

**Files:** `scripts/seed-superadmin.ts`. Run locally with the service key (never committed).

- [ ] **Step 1: Write the script**

```ts
// scripts/seed-superadmin.ts — run: npx tsx scripts/seed-superadmin.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!  // local env only
const username = process.env.SEED_USERNAME ?? 'principal'
const email = `${username}@staff.bl1es.portal`             // synthesized auth email
const password = process.env.SEED_PASSWORD!
const contactEmail = process.env.SEED_CONTACT_EMAIL ?? null // real email (future reset/notifications)

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (error) throw error

const { error: pErr } = await admin.from('profiles').insert({
  id: data.user!.id, role: 'superadmin', username, contact_email: contactEmail,
  first_name: process.env.SEED_FIRST ?? 'School', last_name: process.env.SEED_LAST ?? 'Principal',
})
if (pErr) throw pErr
console.log('Seeded superadmin — login username:', username)
```

- [ ] **Step 2: Run locally** (secrets via env, not committed):

```bash
SUPABASE_URL=https://kdzkydshyibxpquvjcjy.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service key, local only> \
SEED_USERNAME=principal SEED_PASSWORD=<choose> SEED_CONTACT_EMAIL=<real email> \
npx tsx scripts/seed-superadmin.ts
```

- [ ] **Step 3: Verify** — user exists in Supabase Auth (email `principal@staff.bl1es.portal`), and
  `profiles` has a `superadmin` row with `username = principal`.

---

### Task 6: Auth API functions

**Files:** `src/features/auth/api/{resolve-login-email,sign-in,sign-out,get-current-profile}.ts`.

**Produces:** `resolveLoginEmail(identifier: string): string`; `signIn(identifier, password): Promise<void>`; `signOut(): Promise<void>`; `getCurrentProfile(): Promise<Profile | null>` where `Profile = { id: string; role: 'superadmin'|'admin'|'normal'; firstName: string; lastName: string; username: string | null }`.

- [ ] **Step 1: `resolve-login-email.ts`** (pure, client-side, no lookup)

```ts
const STUDENT_NUMBER = /^bl1es-\d{4}-\d{4}$/i
export function resolveLoginEmail(identifier: string): string {
  const id = identifier.trim().toLowerCase()
  return STUDENT_NUMBER.test(id)
    ? `${id}@students.bl1es.portal`
    : `${id}@staff.bl1es.portal`
}
```

- [ ] **Step 2: `sign-in.ts`**

```ts
import { supabase } from '@/lib/supabase'
import { resolveLoginEmail } from './resolve-login-email'

export async function signIn(identifier: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(identifier), password,
  })
  if (error) throw new Error('Incorrect login or password')
}
```

- [ ] **Step 3: `sign-out.ts`**

```ts
import { supabase } from '@/lib/supabase'
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
```

- [ ] **Step 4: `get-current-profile.ts`**

```ts
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  role: 'superadmin' | 'admin' | 'normal'
  firstName: string
  lastName: string
  username: string | null
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles').select('id, role, first_name, last_name, username').eq('id', user.id).single()
  if (error) throw error
  return { id: data.id, role: data.role, username: data.username,
           firstName: data.first_name, lastName: data.last_name }
}
```

- [ ] **Step 5: Verify** — `npm run build` passes.

---

### Task 7: Real auth provider + hooks (replace the mock)

**Files:** rewrite `src/features/auth/hooks/use-auth.tsx`; create `use-profile.ts`, `use-login.ts`, `use-logout.ts`; test `use-auth.test.tsx`.

**Produces:** `useAuth(): { session, isAuthenticated, isLoading }`; `useProfile()` (key `['auth','profile']`); `useLogin()`; `useLogout()`.

- [ ] **Step 1: Failing test** (`use-auth.test.tsx`) — mock `@/lib/supabase`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
const getSession = vi.fn(async () => ({ data: { session: null } }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { onAuthStateChange, getSession } } }))

import { AuthProvider, useAuth } from './use-auth'
function Probe() {
  const { isAuthenticated, isLoading } = useAuth()
  return <div>{isLoading ? 'loading' : isAuthenticated ? 'in' : 'out'}</div>
}
describe('useAuth', () => {
  it('resolves to signed-out when there is no session', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('out')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run — expect FAIL** (`useAuth` is still the mock localStorage version): `npm run test`

- [ ] **Step 3: Rewrite `use-auth.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue { session: Session | null; isAuthenticated: boolean; isLoading: boolean }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setIsLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run test — expect PASS.**
- [ ] **Step 5:** Add `use-profile.ts` / `use-login.ts` / `use-logout.ts` per the CLAUDE.md hook
  templates, wrapping `getCurrentProfile` / `signIn` / `signOut`. `useLogin`/`useLogout`
  `invalidateQueries({ queryKey: ['auth','profile'] })` on success; `useProfile` `enabled` only when
  `useAuth().isAuthenticated`.
- [ ] **Step 6: Verify** — `npm run test` + `npm run build` pass.

---

### Task 8: Wire LoginPage + RequireAuth to real auth

**Files:** modify `src/routes/require-auth.tsx`, `src/features/auth/pages/LoginPage.tsx`; update `src/App.test.tsx`.

- [ ] **Step 1: `require-auth.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
```

- [ ] **Step 2: `LoginPage.tsx`** — replace the mock `login()`: on submit call
  `useLogin().mutate({ identifier, password })`; on success `navigate('/dashboard')`; render an error
  message on failure. Keep the existing markup/design; only swap the submit handler + add error state.

- [ ] **Step 3: Update `src/App.test.tsx`** — mock `@/lib/supabase` (no session, as Task 7); assert
  the root and `/dashboard` both redirect to `/login` when unauthenticated.

- [ ] **Step 4: Verify** — `npm run test` + `npm run build` pass.

---

### Task 9: End-to-end verification (real login)

- [ ] **Step 1:** `.env` has real URL + anon key; superadmin seeded (Task 5).
- [ ] **Step 2:** `preview_start`; open `/login`.
- [ ] **Step 3:** Log in as `principal` + the chosen password → redirect to `/dashboard`;
  `useProfile` returns `role: 'superadmin'`.
- [ ] **Step 4:** Reload → session persists. Log out → back to `/login`, and `/dashboard` bounces to
  `/login`.
- [ ] **Step 5:** No console errors; capture a screenshot for the record.

---

## Self-review

- **Spec coverage:** every § Data model table → Task 2 (incl. `contact_email`); RLS intent → Task 3;
  synthesized-email login → Tasks 6 (`resolveLoginEmail`); superadmin seed → Task 5; "replace mock
  auth" → Tasks 7-8. Registration/invite flows deferred to Management (scope boundary).
- **Consistency with decisions:** Axios removed (Task 1); no login RPC (client-side resolution);
  migrations pushed to the linked project (no Docker).
- **Type consistency:** `Profile` defined once in Task 6, consumed in 7-8; `resolveLoginEmail`
  is synchronous everywhere it's used.
- **Placeholders:** none — SQL, TS, commands concrete. Task 2 references the spec's full column lists
  (a stable, complete source) with all non-obvious constraints enumerated inline.
