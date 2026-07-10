# Settings

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 3. The per-user Settings page. Deliberately **minimal** for v1 — profile +
> password. You flagged superadmin/admin "distinct features" as TBD; we won't invent them, so
> role-specific settings are deferred until a concrete need appears.

## v1 contents (all roles)

Two sections only:

1. **Profile** — display info + photo.
2. **Security** — change password.

(The ported v0 mock also has Notifications + Preferences tabs; those are trimmed for v1 — see
deferred below.)

## Profile

| Field | superadmin | admin | normal (student/parent) |
|---|---|---|---|
| Profile photo | edit | edit | edit |
| Own display name | edit | edit | **read-only** — the student's official name is superadmin-managed |
| Email / username | read-only | read-only | n/a (login is the student number) |
| Guardian name / relationship / contact # / email | — | — | **edit** (parent self-service) |

- Photo uploads to Supabase Storage; initials fallback (as the UI already renders).
- Editing `guardian_email` only changes the **notification/reset delivery** address — the student's
  Supabase auth email is the synthesized internal one and is untouched — so it's safe self-service.
- Staff email is read-only in v1 (changing an auth email needs a re-verification flow — deferred).
- A student's official name isn't self-editable (record integrity); superadmin changes it in
  Management.

## Security — change password

- Fields: current password, new password, confirm new.
- Flow: **re-authenticate with the current password** to verify identity, then Supabase
  `updateUser({ password })`. (Supabase doesn't require the current password for the update, so we
  verify it ourselves first.)
- Uniform across roles — students are authenticated after login-by-number, so the same call works.
- **"Forgot password"** (logged out) is *not* here — it lives on the login page (staff: native
  reset email; students: reset link to `guardian_email`).

## Out of scope / deferred

- **Notifications settings** — no notification engine yet (roadmap); nothing to toggle.
- **Preferences** (accent color, sound, animations, bigger text from the v0 mock) — nice-to-have,
  deferred. ("Bigger text" accessibility may be worth pulling forward later, given young students
  and guardians.)
- **Two-step verification** — deferred.
- **Staff email change** (re-verification flow) — deferred.
- **Superadmin/admin role-specific settings** — deferred until a concrete need appears.

## Open questions

- Confirm parents editing guardian contact details in Settings is wanted (vs. superadmin-only via
  Management).
