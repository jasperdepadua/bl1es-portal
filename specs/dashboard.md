# Dashboard

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 6 — the last of iteration 1. A **minimal, per-role landing view** that
> summarizes everything else. It introduces **no new data model** — every card is derived from Auth,
> Management, Attendance, and Assessment. Built last, on purpose.

Three role-specific dashboards. All scoped to the **current school year**. This reworks the existing
placeholder `DashboardPage` (from the v0 mock) — we keep its visual language (welcome banner + stat
cards + panels) but repopulate it with real v1 content per role. The v0 placeholders that aren't in
v1 scope (assignments, star points, class schedule, subjects) are dropped.

## Superadmin dashboard

- **Current school year** banner — which SY is active + total class days.
- **Stat cards** — counts of teachers, students, sections, subjects (school-wide).
- **Attendance snapshot** — how many sections have recorded today's attendance ("X of Y").
- **Alerts rollup** — students at/over the 20% absence cap; 4Ps at-risk count.
- **Quick links** — register teacher/student, create a section, manage calendar overrides.

## Teacher (adviser) dashboard

- **Greeting + today's date.**
- **Today's attendance** — per advised section: taken / not taken → quick link to record.
- **Alerts** — students in my section(s) approaching or over the absence cap; 4Ps consecutive-absence
  alerts.
- **Progress status** — current term: how much of the progress-report checklist is still unrated
  ("X% marked for Term N"); an ECCD reminder during baseline/endline windows.
- **Quick links** — record attendance, open assessment, my sections.

## Student account dashboard (single shared student/parent view)

- **Header** — child's name, section, adviser, school year.
- **Attendance summary** — present/late/absent counts, "X of 40 absences," status (OK / approaching
  / over).
- **Latest progress** — current-term domain ratings snapshot (CO/DV/BG) + latest teacher comment;
  a nudge to acknowledge the term's report if not yet acknowledged.
- **ECCD** — baseline vs. endline per-domain snapshot, once available.

## Year scoping

Every dashboard reflects the **current** school year. (Viewing prior years lives in Reports later,
not the dashboard.)

## Out of scope / deferred (see roadmap)

- **Announcements feed** — candidate to pull forward in iteration 2; not on the v1 dashboard.
- **Notifications** — needs the notification engine.
- **Charts / analytics / trends** — keep v1 to counts and status, no visualizations.
- The dropped v0 placeholders (assignments, star points, schedule, subjects) — reintroduced only if/
  when those features actually exist.
- **Action-needed banner** — a per-role "things that need you" surface, distinct from the existing
  per-role **Alerts** above (which are attendance-threshold-specific). This is a general
  setup/completeness nudge: e.g. superadmin — no current school year set, a grade level/section
  with no adviser, a subject with no grade-level assignment; teacher — a student not yet
  enrolled/placed into a section, attendance or the term's assessment not yet recorded; student —
  a progress report pending acknowledgement. Idea: a dismissible banner (or persistent checklist)
  at the top of each dashboard, surfacing exactly the next incomplete step for that role. Needs its
  own design pass: exact "needs attention" rules per role, dismissible-vs-persistent, and whether
  it's computed live (query current state on load) or event-driven (would need the notification
  engine). Candidate to pull forward alongside Announcements — it serves the core value loop
  directly (surfacing the setup step a principal forgot, or the record a teacher hasn't filed yet).

## Open questions

- Confirm the per-role card sets above are the right "first glance" for each user, or adjust which
  few things each role sees first.
