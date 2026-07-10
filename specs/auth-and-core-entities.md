# Auth & Core Entities

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 1 of the portal build. Establishes the **identity model** (roles, login,
> registration) and the **foundational academic entities** (school years, grade levels, subjects,
> sections, enrollments) that every later feature reads and writes against. Grading, attendance,
> activities, reports, and dashboards are separate sub-projects that build on this.

## Roles

All users share a base profile: first name, last name, role, profile picture.

| Role | Real-world | Created by | Login identifier | Visibility scope |
|---|---|---|---|---|
| `superadmin` | Principal | Seed (once); can create more superadmins in-app | username | Everything |
| `admin` | Teacher | Superadmin | username | Section(s) they advise (full) + subjects they're assigned (that subject only) |
| `normal` | Student (operated by parent/guardian) | Superadmin | student number | Own records only |

There is **one account per student** — no separate parent/guardian login. The guardian's details
(incl. email for notifications) are attached to the student's account. Student and parent/guardian
**share this single login and see the exact same view** — there is no separate parent-facing view
and no parent role. "Parent/guardian" is just *who might be operating the student's account*, not a
distinct user type.

## Data model

```
school_years ──< grading_periods
school_years ──< sections >── grade_levels
                    │              └──< grade_level_subjects >── subjects
                    ├──< enrollments >── profiles(normal)  ─1:1─ student_details
                    └──< subject_assignments >── profiles(admin)
                                    └── subjects
profiles(admin) ──< sections (as adviser)
auth.users ─1:1─ profiles
```

### Tables

**`profiles`** — 1:1 with Supabase `auth.users` (shared `id`).
- `id` (uuid, pk, fk→auth.users), `role` (enum: superadmin|admin|normal)
- `first_name`, `last_name`, `profile_picture_url`
- `username` (unique, nullable — set for staff, null for students)
- `contact_email` (nullable) — staff's real email, for invite/reset/notification delivery (the auth
  email is synthetic); null for students, who use `student_details.guardian_email`
- `is_active` (bool, soft-delete flag), `created_at`, `updated_at`

**`student_details`** — 1:1 with `profiles` where role = normal.
- `profile_id` (pk, fk→profiles)
- `student_number` (unique) — permanent identity, follows the child Kinder→Grade 6
- `guardian_name`, `guardian_relationship`, `guardian_contact_number`, `guardian_email` (**required** — it's both the onboarding channel and the notification channel)
- `is_4ps_beneficiary` (bool) — 4Ps beneficiaries have special attendance rules (used later)

**`school_years`**
- `id`, `label` (unique, e.g. "2026-2027"), `start_date`, `end_date`
- `is_current` (bool — exactly one true at a time)

**`grading_periods`** — configurable count per school year (school moved 4 quarters → 3 terms).
- `id`, `school_year_id` (fk), `label` (e.g. "Term 1"), `sequence` (int, order within year)
- `start_date`, `end_date` — unique (`school_year_id`, `sequence`)

**`grade_levels`** — superadmin-managed, global across years.
- `id`, `name` (unique, e.g. "Kinder", "Grade 1"), `sequence` (explicit ordering — superadmin-created, so can't rely on alphabetical), `is_active`

**`subjects`** — superadmin-managed, global.
- `id`, `name` (unique), `is_active`

**`grade_level_subjects`** — which subjects a grade level offers (many-to-many).
- (`grade_level_id`, `subject_id`) composite pk
- Global in v1 (a subject applies to a grade level regardless of year). Kinder may have **none**
  (its curriculum is thematic/integrated, not discrete subjects — see reference-findings.md).

**`sections`** — a class-instance for one grade level in one school year.
- `id`, `grade_level_id` (fk), `school_year_id` (fk), `name` (e.g. "Mabini")
- `adviser_id` (fk→profiles role=admin, nullable until assigned)
- `shift` (enum: AM|PM|null — Kinder runs AM/PM shifts)
- `is_active` — unique (`grade_level_id`, `school_year_id`, `name`)

**`enrollments`** — a student's membership in a section (history falls out across years).
- `id`, `student_id` (fk→profiles role=normal), `section_id` (fk→sections)
- `school_year_id` (denormalized from section, for the constraint below)
- `status` (enum: enrolled|inactive for v1; promotion/retention statuses come with grading)
- unique (`student_id`, `school_year_id`) — one section per student per year

**`subject_assignments`** — who teaches what subject, where.
- `id`, `teacher_id` (fk→profiles role=admin), `subject_id` (fk→subjects), `section_id` (fk→sections)
- `is_active` — unique (`teacher_id`, `subject_id`, `section_id`)

## Year scoping (cross-cutting)

**Every school record is scoped to a school year.** It comes for free structurally: enrollments,
attendance, assessments, and anything added later hang off year-scoped `sections`/`enrollments`, so
the school year is always derivable. Practically: every record set can be filtered and reported by
school year (2026-2027, 2027-2028, …), and a student's history *is* the sequence of their per-year
records. Reports and dashboards treat **school year as a first-class filter**.

## Permissions (RLS intent)

RLS enabled on every table; policies keyed on `auth.uid()` → `profiles.role` plus relationships.
Detailed policies written during implementation. Intent:

- **superadmin** — full read/write everywhere.
- **admin as adviser** (`sections.adviser_id = me`) — full access to that section, its enrolled
  students, all subjects + attendance.
- **admin as subject teacher** (`subject_assignments`) — access limited to *that subject's* records
  for that section's enrolled students; **not** attendance, not other subjects.
- **normal** — own `profiles`/`student_details` row, own `enrollments`, own records only.

**Adviser and subject-teacher are relationships, not sub-roles.** There is one `admin` role; whether
a teacher acts as an adviser or a subject teacher is derived *per section* from `sections.adviser_id`
and `subject_assignments`. The same teacher can advise one section and teach a single subject in
another, simultaneously — so it can't be a fixed attribute on the account. A teacher's capabilities
are the per-section **union** of these relationships (surfaced as computed labels like
"Adviser · Kinder–Matulungin" or "MAPEH · Grade 4–Rizal", never a stored sub-role). A subject in a
section with **no** explicit subject-teacher defaults to the adviser.

## Registration, onboarding & login

Supabase Auth is email/password under the hood, with **no native username login**. So every account's
auth email is **synthesized from its login identifier** and resolved entirely client-side: staff →
`{username}@staff.bl1es.portal`, students → `{student_number}@students.bl1es.portal`. The client
formats the identifier into this email, then calls `signInWithPassword` — no lookup, no RPC, no
account-enumeration surface.

Because the auth email is synthetic (not a real inbox), Supabase can't send invite/reset emails
natively. So **all onboarding and password-reset links are delivered to the person's real contact
email via one custom Edge Function** (`profiles.contact_email` for staff,
`student_details.guardian_email` for students). It's still an **invite-link** flow for everyone —
the recipient sets their own password from a one-time link; we just deliver every link ourselves.

**Account creation is two-phase:** first the identity/account is created; then teacher
advisory/subject assignments or student section enrollment happen on separate Management screens.
This mirrors real operations and fits the year-scoped model (identity is permanent; enrollment
repeats each year).

- **superadmin** — first account via **seed script** (admin API sets the synth email + password
  directly); no public signup ever. Can create additional superadmins in-app.
- **admin (teacher)** — superadmin creates the identity (first/last name, `contact_email`) →
  `username` auto-suggested (`firstname.lastname`, numbered on collision, editable) → synth auth
  email `{username}@staff.bl1es.portal` → one-time setup link delivered to `contact_email` → teacher
  sets own password → logs in with username. Advisory/subject assignments are done separately (below).
- **normal (student)** — superadmin creates the identity (first/last name, guardian name /
  relationship / contact # / email, 4Ps flag) → `student_number` generated → synth auth email
  `{student_number}@students.bl1es.portal` → one-time setup link delivered to `guardian_email` →
  guardian/student sets password → logs in with student number. Section enrollment is done separately
  (below).

**Why synthesized emails for everyone:** it enables username/number login with zero lookup and no
enumeration surface, and sidesteps the unique-email collision when siblings share a guardian email.
The trade-off is that we deliver all onboarding/reset links ourselves (one custom Edge Function)
instead of using Supabase's built-in invite email — a marginal cost, since students needed custom
delivery regardless, and it makes staff and students uniform.

### Enrollment & assignment (separate step — screens live in the Management sub-project)

- **Student enrollment** — assign a registered student to a **section** for a school year. The
  section carries its grade level + year, so this is a single choice (grade level is implied). One
  enrollment per student per school year; repeats each year to build history.
- **Teacher assignment** — assign a registered teacher as a section **adviser** (full section
  access) and/or via **subject assignments** (that subject's records for a section). Any mix across
  sections is allowed.

**Password reset:** for all roles, the reset link is delivered to the real contact email
(`contact_email` for staff, `guardian_email` for students) via the same custom Edge Function;
superadmin can re-trigger it.

## Student number format

Placeholder: `bl1es-{enrollmentYear}-{4-digit sequential}` — e.g. `bl1es-2026-0001`. Permanent
(identity), independent of yearly enrollment. Trivially replaceable when the school provides the
official format — it's a generated string, not structural.

## Profile pictures

Supabase Storage bucket (e.g. `avatars/`), RLS so users manage their own; initials fallback (the
UI already renders initials, e.g. "MR").

## Out of scope / deferred (conscious)

- **Teacher (staff) attendance** — you asked for it; it's distinct from student attendance →
  Attendance sub-project.
- **Grading/assessment** — incl. Kinder ECCD (descriptive domains) and KS1 descriptive vs KS2
  numeric grading → Grading sub-project.
- **Activities** (quizzes/exams/events), **Reports**, **Dashboards** → their own sub-projects.
- **Enrollment document requirements** (PSA birth certificate, etc.) — not modeled in v1.
- **Audit log** of record changes — deferred; recommended later for grade integrity.
- **Messaging** (nav placeholder) — not in v1.
- **Notifications engine** — the `guardian_email` field enables it; the engine itself is later.

## Open questions

1. **LIS authority** — is this portal the *authoritative* grade record, or a layer over DepEd's
   official LIS (DO No. 6 s.2025)? Affects grading & reports design. Unresolved. (See
   reference-findings.md.)
2. **Per-year subject curricula** — `grade_level_subjects` is global in v1; move to per-year if the
   school ever varies a grade's subjects between years.

## Follow-ups (deferred, not yet done)

- **Login form:** the Student/Teacher toggle is currently **cosmetic** (login is resolved purely by
  the identifier format), and the staff field is mislabeled "Email address". Planned: make the
  toggle **functional** and correct the labels — "Username" for staff, "Student ID" for student.
