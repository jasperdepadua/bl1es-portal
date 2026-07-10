# Management — Implementation Plan

> **For agentic workers:** dispatch each task to its owning agent, verify (build/test/browser)
> before marking it done, land only via the `git-workflow` skill on explicit user request. Steps
> use checkbox (`- [ ]`) syntax for tracking. See the sub-agent-team workflow memory for allocation
> rules.

**Goal:** Give the superadmin (principal) a full CRUD surface — School Years, Grade Levels,
Subjects, Sections (the enrollment/assignment hub), Teachers, and Students — that populates the
entities `auth-and-core-entities` already created, so the school can actually be set up.

**Architecture:** Same stack and API-layer pipeline as Auth (`CLAUDE.md`). One new piece: a
Supabase **Edge Function** (`register-user`) is the only path that creates a new `auth.users` row —
the client can never hold the `service_role` key needed for that, so registration can't be a plain
table insert like the rest of Management's CRUD.

**Tech Stack:** React 19, TanStack Query, React Router, Supabase (Postgres/Auth/Edge Functions),
shadcn/ui, Vitest + RTL — no new dependencies expected.

## Scope boundary

- Builds the CRUD screens in `specs/management.md`. Does **not** touch Attendance, Assessment, or
  Dashboard.
- **No new tables or RLS policies for the six existing entities** — `auth-and-core-entities`
  already grants superadmin full read/write on all ten tables (verified in
  `supabase/migrations/*_rls.sql`). Re-verify this against the live DB before building UI on top of
  it; don't assume without checking.
- **New backend surface:** the `register-user` Edge Function (see Key decision below) — the one
  piece of Management that genuinely needs new backend work.
- Builds the **real** invite-link onboarding flow (not deferred anymore — see Key decision) using
  Mailtrap Sandbox as the dev/testing email transport; production swaps in a verified domain + real
  ESP later, same code. Bulk import / year rollover / audit log stay roadmap-deferred.

## Key decision — locked in

**Registering a teacher/student needs a privileged Edge Function, not a client insert.** Creating an
`auth.users` row requires `admin.createUser()`, which needs the `service_role` key — that key must
never reach the browser (same reason the superadmin seed script runs locally, not from the app).

So `register-user` (Edge Function):
1. Verifies the caller's JWT role is `superadmin` (never trust a client-supplied role claim).
2. Synthesizes the auth email (`{username}@staff...` / `{student_number}@students...`).
3. Calls `admin.createUser()` **without a password** (no password exists until the recipient sets
   one), then inserts the `profiles` row (+ `student_details` if a student). If the profile insert
   fails, deletes the just-created auth user — an orphaned `auth.users` row with no profile is a
   known Supabase footgun.
4. Calls `admin.generateLink({ type: 'invite', email: <synthesized email> })` to get a secure,
   single-use, expiring `action_link` — this is Supabase's documented mechanism for exactly this
   case (custom email delivery instead of Supabase's own mailer, which can't reach a synthetic
   address anyway).
5. Emails that link to the real `contact_email`/`guardian_email` via `nodemailer` (`npm:nodemailer`
   import — Supabase's own documented pattern for Edge Functions) over SMTP. **Dev/test transport:**
   Mailtrap Sandbox (`sandbox.smtp.mailtrap.io` — free, zero domain verification, captures every
   send into a dashboard inbox regardless of recipient). **Production:** swap the SMTP
   host/port/user/pass secrets for a verified-domain provider (e.g. Resend) — the sending code
   doesn't change, only the secrets.
6. Returns success (no credentials in the response — the link went straight to the recipient's real
   email, nothing sensitive travels back to the superadmin's browser).

The recipient clicks the link, lands on a new `/accept-invite` page in our app (Task 5), and sets
their own password to complete registration — no temp password, no forced-change flag needed; there
simply isn't a working password until this step completes.

**Mailtrap setup (one-time, you do this locally):** sign up free at mailtrap.io → Email Testing →
My Sandbox → Integration tab → SMTP → copy Host/Port/Username/Password → store as Edge Function
secrets (`npx supabase secrets set MAILTRAP_HOST=... MAILTRAP_PORT=587 MAILTRAP_USER=... MAILTRAP_PASS=...`),
never committed.

## Global constraints

- Follow `CLAUDE.md` (feature-oriented structure, strict API-layer pipeline, TS strict, query-key
  convention: `['management', entity, ...params]`).
- Soft-delete only (`is_active`) — never hard-delete a row another table references.
- `service_role` key lives only as a Supabase Edge Function secret (`npx supabase secrets set`),
  never in client code/env, never committed, never pasted into chat.
- **Tone scales with audience, same tokens everywhere** (`design-system/README.md`, updated this
  session): Management is superadmin/teacher operational work → dense, efficient, professional
  register — not the illustrated/playful register of the login/dashboard.
- `cursor-pointer` only on genuinely interactive custom elements — never blanket-applied.
- Any v0-sourced mockup gets converted (colors/fonts/components re-homed onto our tokens and
  `src/components/ui/`), never imported as-is — `ui-ux-critic` is the explicit gate on this.

## File structure (anticipated)

- `supabase/functions/register-user/index.ts` — the new Edge Function.
- `src/features/management/pages/` — `SchoolYearsPage`, `GradeLevelsPage`, `SubjectsPage`,
  `SectionsPage`, `SectionDetailPage`, `TeachersPage`, `StudentsPage`.
- `src/features/management/components/` — shared pieces reused across entities (data table,
  entity form dialog, confirm dialog, status/role chips).
- `src/features/management/api/*.ts` — one function per operation; `registerTeacher` /
  `registerStudent` call the Edge Function via `supabase.functions.invoke('register-user', ...)`.
- `src/features/management/hooks/*.ts` — `useQuery`/`useMutation` wrappers.
- `src/routes/` — `/management/*` routes, gated to superadmin (new role guard alongside
  `RequireAuth`).

## Tasks

### Task 0: Design exploration (you + v0)

- [ ] Generate the Sections-hub mockup in v0 (prompt to follow separately).
- [ ] Bring the result back — `ui-ux-critic` checks it against `design-system/` **before** any
  conversion work starts. This is the answer to "what if I don't like what v0 produces": the gate
  exists precisely so a mismatched result gets caught before it's built, not after.

### Task 1: Role-gated Management routes + nav

**Owner:** `frontend-engineer`.

- [ ] Add a superadmin-only role guard alongside `RequireAuth`.
- [ ] Add the "Management" nav group to `portal-shell.tsx` (superadmin only); children ordered per
  `specs/management.md` § Navigation.
- [ ] Empty page shells for all 7 routes so routing is provable before content lands.
- [ ] Verify: build/test pass; manually confirm a non-superadmin can't reach `/management/*`.

### Task 2: `register-user` Edge Function

**Owner:** `db-engineer`.

- [ ] Write `supabase/functions/register-user/index.ts` per the Key decision above (`admin.createUser`
  → `admin.generateLink({ type: 'invite' })` → `nodemailer` send over SMTP).
- [ ] Run the `owasp-check` skill — this is a privileged server endpoint; broken access control is
  OWASP's #1 risk, so the in-function role check is the load-bearing line, not a UI-level gate. Also
  confirm the invite link/token is never echoed back in the function's response or logged.
- [ ] Tech lead sets the Mailtrap secrets and deploys (`npx supabase secrets set ...`,
  `npx supabase functions deploy register-user`) — human step, needs the linked project.
- [ ] Verify: invoke as a seeded superadmin JWT (succeeds, email appears in the Mailtrap sandbox
  inbox); invoke as a non-superadmin JWT (rejected).

### Task 3: School Years, Grading Periods, Grade Levels, Subjects

**Owner:** `frontend-engineer` + `test-writer`.

- [ ] Build in dependency order (simple list + modal pattern — no v0 mockup needed for these; reuse
  the visual language established once Sections is converted, or build first with existing tokens).
- [ ] School Years: list, create/edit, "set current" (confirm dialog — only one at a time), nested
  grading-period management.
- [ ] Grade Levels: reorderable list, create/edit.
- [ ] Subjects: list with grade-level chips, create/edit with multi-select.
- [ ] Tests: happy-path CRUD; the "exactly one current school year" invariant surfaces correctly.
- [ ] Verify: build/test pass; `ui-ux-critic` pass (design-system fidelity, a11y, tone-by-audience).

### Task 4: Sections (the hub) — convert the accepted v0 mockup

**Owner:** `frontend-engineer` + `ui-ux-critic` + `test-writer`.

- [ ] Convert the mockup into our Vite/Tailwind/shadcn stack (same process as the original
  login/dashboard conversion) — preserve layout/IA, re-home all styling onto our tokens.
- [ ] Wire: sections list (filter by year/grade level), create/edit, detail page tabs (Roster /
  Adviser / Subject teachers) to real data through the API-layer pipeline.
- [ ] `ui-ux-critic`: post-conversion design-system fidelity pass — the explicit "still matches our
  theme" checkpoint.
- [ ] Tests: enroll/unenroll, adviser assignment, subject-teacher assignment, Kinder's "no subjects"
  empty state.
- [ ] Verify: build/test pass.

### Task 5: Teachers + Students (registration flows)

**Owner:** `frontend-engineer` + `test-writer`.

- [ ] List pages (filters; adviser-of/subjects-taught as chips; active/inactive).
- [ ] Register forms → `registerTeacher`/`registerStudent` → success screen confirms an invite was
  sent to the contact/guardian email (no credentials shown — see Key decision).
- [ ] New `/accept-invite` page: lands from the emailed link, establishes the Supabase session it
  carries, prompts for a new password (`updateUser({ password })`), then redirects to `/dashboard`.
- [ ] Edit (name/contact/guardian fields) + deactivate (confirm dialog, soft — preserves historical
  assignments/enrollments).
- [ ] Tests: registration happy path (mocked Edge Function response); accept-invite sets a password
  and redirects; deactivate doesn't cascade-delete history.
- [ ] Verify: build/test pass; `ui-ux-critic` + `code-reviewer` pass — registration touches PII and
  a privileged endpoint, run `owasp-check`.

### Task 6: End-to-end verification

- [ ] `preview_start`; as the seeded superadmin, walk the full setup order: school year → grade
  level → subject → section → register + assign a teacher → register + enroll a student.
- [ ] Spot-check RLS still holds through the new UI (a teacher only sees their own section(s), once
  we can log in as one).
- [ ] Screenshot record.

## Self-review

- **Spec coverage:** `specs/management.md` screens → Tasks 3-5; navigation → Task 1; the auth spec's
  "recipient sets their own password from a one-time link" design → Task 2 + `/accept-invite`.
- **Beyond the original spec narrative:** the Edge Function requirement (Task 2) and the concrete
  `generateLink` + Mailtrap mechanism are implementation detail the spec didn't need to name — noted
  here and in `specs/management.md` § Out of scope for traceability.
- **Consistency:** query-key convention matches `CLAUDE.md`; RLS reuse (no new policies for existing
  entities) is a stated assumption to re-verify, not re-derive, in Task 1.
