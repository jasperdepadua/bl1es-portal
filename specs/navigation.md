# Navigation (sidebar IA)

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** The per-role sidebar for the app shell (`PortalShell`). Cross-cutting — it references
> the feature specs rather than redefining them. Items are marked **v1** (Kinder pilot) or **v2+**
> (deferred, tracked in `plan/roadmap.md`).

The sidebar is role-specific. Ordered by steady-state frequency (Dashboard first, Settings last) —
not by dependency.

## Superadmin

1. Dashboard — v1
2. **Management** ▸ Teachers · Students · Sections · Subjects · Grade Levels · School Years — v1
   (sub-item detail in [`management.md`](./management.md))
3. Attendance — v1 (school-wide view)
4. **Academics** ▸ Assessment · *Quizzes & Exams (v2+)* · *Events (v2+)* — v1 (Assessment only)
5. Reports — v2+
6. Settings — v1

## Teacher (admin)

1. Dashboard — v1
2. My Sections — v1
3. Attendance — v1
4. **Academics** ▸ Assessment *(+ ECCD for Kinder)* · *Quizzes & Exams (v2+)* — v1 (Assessment only)
5. Reports — v2+ (v1: basic print from a record view)
6. Settings — v1

## Student account (single shared student/parent view)

1. Dashboard — v1
2. Attendance — v1
3. **Academics** ▸ Progress report · ECCD — v1
4. Reports — v2+ (request a copy)
5. Settings — v1

## The Academics group

The umbrella for learning records and graded work. Sub-items:

- **Assessment** — the report/grade, **Key-Stage-polymorphic**: descriptive competency checklist for
  Kinder (CO/DV/BG) and Grades 1-3 (A-E); numeric grades for Grades 4-6. See
  [`assessment.md`](./assessment.md).
- **ECCD** — Kinder-only developmental screening (shown only for Kinder learners / their advisers).
- **Quizzes & Exams** *(v2+)* — graded-work authoring/scoring that feeds the Grades 4-6 numeric
  grades.
- **Events** *(v2+)* — school events / activities calendar.

Attendance stays a top-level item (it isn't assessment). Reports remain top-level (v2+).
