# Attendance

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 4. Recording and viewing student attendance for the Kinder pilot.
> Whole-day granularity, with a per-subject-ready model. Builds on
> [`auth-and-core-entities.md`](./auth-and-core-entities.md).

## Granularity

- **v1: whole-day** — one mark per enrolled student per class day, recorded by the section adviser.
- **Per-subject-ready model:** `sections.attendance_mode` (`whole_day` | `per_subject`, default
  `whole_day`) + an optional `subject_assignment_id` on each record. Only `whole_day` is built and
  used in v1; `per_subject` switches on for departmentalized upper grades later, no rework.

## Per-student statuses

`present` · `late` · `absent`. An `absent` can be flagged **excused** (documented) with an optional
reason note. **Excused absences do not count toward the 20% cap.**

## Day-level markers (ad-hoc · superadmin · school-wide)

A date can be overridden as **holiday**, **suspension** (with a note — typhoon / LGU order), or
**non-teaching day** (in-service, card distribution, brigada). On a marked day: no attendance is
taken and it doesn't count as a class day held. This is a whole-day property, distinct from the
per-student status above — no full pre-built calendar, just flag a date when it happens.

## The 20% absence cap

- **Denominator:** `school_years.total_class_days` (superadmin-configured, e.g. 201) → cap =
  `floor(0.20 × total)` (e.g. 40). Computed **per school year** for v1 (per-term breakdowns arrive
  with Reports).
- **Counted absences** = `absent` AND not excused, for the enrollment.
- **Soft warning** as absences approach the DepEd intervention point (~12, tunable); **hard flag**
  at/over the cap (fail / no-credit risk).

## 4Ps rule

Students flagged `is_4ps_beneficiary`: **3 consecutive class-day absences** (skipping non-class
days) → alert (risk of removal from the 4Ps list). Surfaced to the adviser and superadmin.

## Data model additions

- **`attendance_records`** — `id`, `enrollment_id` → enrollments, `date`, `status`
  (present|late|absent), `is_excused` (bool), `reason_note` (nullable), `subject_assignment_id`
  (nullable; null = whole-day), `recorded_by` → profiles, timestamps. Unique
  (`enrollment_id`, `date`, `subject_assignment_id`).
- **`calendar_overrides`** — `id`, `school_year_id`, `date`, `type` (holiday|suspension|non_teaching),
  `note` (nullable), `created_by`. Unique (`school_year_id`, `date`).
- **`school_years`** += `total_class_days` (int) — the cap denominator (managed on the School Years
  screen).
- **`sections`** += `attendance_mode` (whole_day|per_subject, default whole_day).
- Year scoping is automatic: attendance hangs off year-scoped `enrollments`; overrides carry
  `school_year_id`.

## Views by role

- **Adviser (teacher)**
  - *Record:* pick section + date → roster; defaults everyone to present; toggle late/absent; flag
    excused + note; save. Blocked on override days (shows the reason).
  - *Overview:* per-student absence counts + cap status for the section; 4Ps and cap alerts.
- **Student account** (single shared student/parent view): own attendance — summary (present/late/
  absent counts, "X of 40" absences, status OK / approaching / over) + dated history.
- **Superadmin:** manage `calendar_overrides` + `total_class_days`; school-wide attendance
  oversight (light in v1).

## Permissions

- **Adviser** — record/edit/view attendance for their section(s). (Per-subject recording by subject
  teachers is deferred with `per_subject` mode.)
- **Superadmin** — everything + day overrides + `total_class_days`.
- **Student account** — read own only.

## Out of scope / deferred

- Per-subject/period attendance (model ready; built for upper grades later).
- Full pre-defined school calendar; dynamically recomputing prescribed days from suspensions.
- Half-day / early dismissal.
- Per-term cap computation + SF9 attendance blocks (with the Reports engine).
- Absence-threshold notifications (needs the notification engine).

## Open questions

- **Cap period:** v1 computes the 20% cap per school year — confirm per-year (vs per-term) is
  acceptable for now.
- **Intervention threshold** (~12) — confirm the tunable default or set a specific number.
