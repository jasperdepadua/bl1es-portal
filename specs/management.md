# Management

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 2. The **superadmin** CRUD surface for setting up the school and its people
> — the UI that populates the entities defined in
> [`auth-and-core-entities.md`](./auth-and-core-entities.md). Recording *records* (attendance,
> assessment) is **not** here — that's the Attendance and Assessment sub-projects. Teachers do not
> manage entities; they get a "My Sections" working view (defined with those features).

## Access

- **Entity management is superadmin-only.** The grouped "Management" nav appears only for superadmin.
- Teachers reach *their* sections through a separate "My Sections" view (operational, not CRUD).

## Navigation

Grouped **Management** parent (superadmin only), children ordered by steady-state frequency:

`Teachers · Students · Sections · Subjects · Grade Levels · School Years`

(First-time *setup* runs the other way — the dependency order below — but day-to-day a principal
touches people and sections far more than structure, so the menu leads with those.)

## Screens

### School Years
- **List:** label, start/end dates, `current` badge.
- **Create/edit:** label (e.g. "2026-2027"), start_date, end_date.
- **Set current** — exactly one current year at a time.
- **Grading periods** managed within a year: add/edit periods (label, sequence, start/end).
  Configurable count (3 terms for SY 2026-2027).
- Can't hard-delete a year with sections/enrollments → deactivate instead.

### Grade Levels
- **List:** name, sequence, active. **Create/edit:** name (e.g. "Kinder", "Grade 1"), sequence.
- Global across years. Deactivate (soft), don't hard-delete.

### Subjects
- **List:** name, active, grade levels it's assigned to.
- **Create/edit:** name; **assign to grade levels** (multi-select → `grade_level_subjects`).
- Kinder typically has **none** (its assessment is ECCD domains, not subjects).

### Sections (the hub)
- **List:** filter by school year + grade level; columns: name, grade level, year, adviser,
  enrolled count.
- **Create/edit:** grade level, school year, name (e.g. "Matulungin"), shift (AM/PM/none), adviser
  (optional at creation). Unique (grade level, year, name); the same name recurs each year as a new
  section.
- **Detail page = the enrollment/assignment hub** (section-centric):
  - **Roster** — enrolled students; enroll from the pool of registered students not yet enrolled
    *this year*; remove/unenroll. Enforces one enrollment per student per school year.
  - **Adviser** — assign/change (pick a teacher). Grants full access to the section.
  - **Subject teachers** — for each subject in this grade level, assign a teacher
    (`subject_assignments`). Sparse/empty for Kinder.

### Teachers
- **List:** name, contact email, username, adviser-of (sections), subjects taught, active.
- **Register (identity only):** first/last name, `contact_email` → generates `username`, creates
  account with a synthesized auth email (`{username}@staff.bl1es.portal`), sends a **custom invite
  link to `contact_email`**. Assignments happen on Section pages, not here.
- **Edit:** name, contact email. **Deactivate:** soft — preserves historical records/assignments.

### Students
- **List:** name, student number, current-year section, guardian, active. Filter by grade/section/year.
- **Register (identity only):** first/last name, guardian name/relationship/contact/email, 4Ps flag
  → generates `student_number`, creates account (synthesized auth email), sends setup link to
  `guardian_email`. Enrollment happens on Section pages, not here.
- **Edit:** name, guardian info, 4Ps flag. **Deactivate:** soft.
- A registered-but-unenrolled student can log in but sees an empty state until enrolled.

## Setup / build order (dependency chain)

Both the first-time setup flow and the implementation order:

`School Years (+ periods) → Grade Levels → Subjects → Sections → Teachers → Students → enroll/assign (via Section pages)`

## Out of scope / deferred (see roadmap)

- **Bulk student import** (CSV) — v1 is single-entry registration.
- **Year rollover / promotion** — the year-scoped model supports it; the workflow is deferred.
- **Audit log** of management actions.

## Open questions

- **Student number format** — placeholder `bl1es-{year}-{seq}` until the school provides the
  official format (see auth spec). Assigned at registration, permanent.
