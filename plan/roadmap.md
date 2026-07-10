# Product roadmap

> **Status:** Living document. Phased plan for the portal. Iteration 1 ships the core value loop
> piloted on **Kindergarten**; later iterations expand grade bands and features. Deferred items are
> parked here on purpose so they stay in the pipeline and aren't forgotten.

## Guiding principle

The core value loop is: **superadmin sets up the school → teacher records attendance + assessment →
parent/student sees them.** Ship that first, expand outward. Everything not on that loop is an
enhancement.

## Iteration 1 — Kindergarten pilot (core loop)

Kinder-first keeps v1 small and coherent: no numeric grades, no quizzes/exams, "grading" *is* the
ECCD assessment. The data model stays fully grade-agnostic (grade levels, subjects, sections for
any grade); the pilot just *populates* Kinder.

Build order (each gets its own spec → plan → implementation cycle):

| # | Area | Scope for v1 |
|---|---|---|
| 1 | **Auth & core entities** | ✅ Specced — see [`specs/auth-and-core-entities.md`](../specs/auth-and-core-entities.md) |
| 2 | **Management** | CRUD: school years, grading periods, grade levels, subjects, sections; register teachers (+ adviser/subject assignments); register students (+ enroll into sections) |
| 3 | **Settings** | Password change + profile edit (all roles). Role-specific extras deferred until a concrete need appears |
| 4 | **Attendance** | Teacher records; parent/student views. Kinder rules from the orientation deck: 20% absence cap (40 days), 4Ps 3-consecutive-absence rule |
| 5 | **Assessment (Kinder ECCD)** | Teacher records ECCD 8-domain descriptive ratings + N/P/K progress; parent/student views. This *is* Kinder's "grading" |
| 6 | **Dashboard + student view** | Minimal, role-appropriate summary over the above. One shared student/parent view (single account — no separate parent view). Define exactly what it shows |

## Deferred pipeline (iteration 2+)

Parked deliberately — real features, just not in the first release.

### Grade-band expansion
- **Grades 1-3 (KS1)** — descriptive A-E grading.
- **Grades 4-6 (KS2)** — numeric 0-100 grading: weighted components (Written/Oral Works,
  Performance Tasks, Exams), transmutation table (SY 2026-2027 only).
- **Subject-based gradebook** — quizzes/exams/performance tasks → computed subject grades (only
  meaningful once KS1/KS2 are in scope; Kinder doesn't use it).

### Feature expansion
- **Activities** — quiz/exam authoring + monitoring; school events calendar. (LMS-lite; the largest
  deferred piece. Not applicable to the Kinder pilot at all.)
- **Reports engine** — SF9 (Learner Progress Report) / SF10 (permanent record) generation; parent
  report **request + approval** workflow. (v1 gets only a simple on-screen/printable record view.)
- **Announcements** — parent communication feed. Cheap + high parent-value; **candidate to pull
  forward** early in iteration 2, given the docs' heavy emphasis on parent comms.
- **Teacher (staff) attendance** — distinct from student attendance; superadmin views it.
- **Notifications engine** — email beyond auth (grades released, attendance alerts, announcements).
  The `guardian_email` field enables it; the engine itself is deferred.

### Ops / scale
- **Bulk student import** (CSV) — real schools have hundreds of students; one-by-one won't scale.
- **Year rollover / promotion workflow** — promote enrolled students to next grade, roll sections
  to the next school year. (Data model already supports it; only the workflow is deferred.)
- **Audit log** — who changed a grade/record, for integrity.

## Open strategic questions

- **LIS authority** — is this portal the authoritative grade record, or a layer over DepEd's
  official LIS (DO No. 6 s.2025)? Affects grading & reports design. (See
  [`specs/reference-findings.md`](../specs/reference-findings.md).)
- **Student onboarding** — synthesized-email + guardian-delivered setup (see auth spec, open
  question #2) — confirm acceptable.
