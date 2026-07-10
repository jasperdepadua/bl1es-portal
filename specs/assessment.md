# Assessment (Kindergarten)

> **Status:** Draft (brainstorm output, pending review).
> **Scope:** Sub-project 5. Kinder's **two** assessment instruments for the pilot — the **Progress
> Report** (Kinder's "grading") and the **ECCD** developmental screening. Builds on
> [`auth-and-core-entities.md`](./auth-and-core-entities.md) and
> [`attendance.md`](./attendance.md). Grades 1-3 descriptive (A-E) and KS2-4 numeric grading are
> deferred (see roadmap).

Kinder is **descriptive, non-numeric** (DO 015 §40) — no numeric grades, and no academic awards for
Kindergarten (only character/attendance recognition, itself deferred).

---

## Instrument 1 — Kindergarten Progress Report (the "grading")

Official basis: **DO 015 Annex E**; scale from **Table 7 (p.10)**.

### Scale — CO / DV / BG
- **CO — Consistent** (*Palagiang Naipapakita*)
- **DV — Developing** (*Umuusbong*)
- **BG — Beginning** (*Nagsisimula*)

### Structure
A fixed **competency checklist** across **4 curriculum domains** (~40 competencies total):
1. **Sensory-Perceptual & Motor Development**
2. **Socio-emotional Development**
3. **Cognitive Development**
4. **Language, Literacy & Communication** — sub-areas: listening & viewing, sight-word recognition,
   speaking, reading (phonological awareness / letter knowledge / letter-sound), comprehension,
   concepts of print, writing.

Each competency is rated **CO/DV/BG per term (T1/T2/T3)** by the adviser. The report also carries
**per-term teacher comments**, a **per-term parent/guardian acknowledgement**, and an **attendance
record** (per term/month) pulled from the Attendance feature.

> The exact competency wording is transcribed/seeded verbatim from DO 015 Annex E when we build the
> seed data — this spec captures the structure, not the final competency strings.

### Data model
- **`kinder_competencies`** (seed) — `id`, `domain` (enum), `sub_area` (nullable), `sequence`,
  `label`. Seeded once from Annex E.
- **`progress_ratings`** — `id`, `enrollment_id`, `competency_id`, `grading_period_id`, `rating`
  (CO|DV|BG, nullable until marked), `updated_by`, `updated_at`. Unique
  (`enrollment_id`, `competency_id`, `grading_period_id`).
- **`progress_report_remarks`** — `id`, `enrollment_id`, `grading_period_id`, `comments` (text),
  `parent_acknowledged_at` (nullable). Unique (`enrollment_id`, `grading_period_id`).

---

## Instrument 2 — ECCD developmental screening (the gauge)

Official basis: the ECCD Checklist; methodology in DepEd's *"Tracking Our Progress: Kindergarten!"*
guide (linked in **DO 015 §42**).

### Structure — 8 domains
Gross Motor, Fine Motor, Self-Help, Self-Help/Toilet Training, Receptive Language, Expressive
Language, Cognitive, Social-Emotional.

### Bands (SSDOD → SHAD)
Significant delay → slight delay → average development → slightly advanced → highly advanced.
*(Exact abbreviations/labels to be confirmed against the official guide during implementation — these
came from the orientation deck.)*

### v1 grain
Teacher records **one band per domain, at two checkpoints: baseline (start of year) and endline
(end of year)** — so growth is visible. Full item-level scoring against age norms is deferred until
we source the official guide's item lists + norm tables.

### Data model
- **`eccd_domains`** (seed) — `id`, `name`, `sequence`, `item_count` (informational). 8 rows.
- **`eccd_assessments`** — `id`, `enrollment_id`, `checkpoint` (baseline|endline), `domain_id`,
  `band` (nullable until assessed), `assessed_by`, `assessed_at`. Unique
  (`enrollment_id`, `checkpoint`, `domain_id`).

---

## Views by role

- **Adviser (teacher):**
  - *Progress Report* — per-section, per-term competency grid (student × competency → CO/DV/BG);
    quick-mark; enter per-term comments.
  - *ECCD* — per-section, per-checkpoint domain grid (student × 8 domains → band).
- **Student account** (single shared student/parent view): own Progress Report (competency ratings
  by domain per term, teacher comments, attendance record) with a **per-term acknowledgement**
  action; own ECCD results (baseline vs endline per domain, showing growth).
- **Superadmin:** read/oversight; manages the seed lists (competencies, ECCD domains).

## Permissions

- **Adviser** — record/edit both instruments for their section's enrolled students. (Kinder is
  self-contained, so the adviser has full access; subject teachers don't apply to Kinder.)
- **Superadmin** — oversight + seed-list management.
- **Student account** — read own; acknowledge the Progress Report per term.

## Year scoping

Both instruments hang off year-scoped `enrollments` — the Progress Report per term (via
`grading_periods`), ECCD per checkpoint — so everything is reportable per school year.

## Out of scope / deferred (see roadmap)

- **Grades 1-3 descriptive (A-E, Table 8)** and **KS2-4 numeric grading** (weighted WW/PT/Exam,
  transmutation).
- **Full item-level ECCD** + automatic age-norm band computation.
- **SF9 report generation/printing** + parent request-approval → Reports engine.
- **Awards** (character-traits / perfect-attendance for K) → Awards (deferred).
- **Numeric equivalents** for system-level reporting (DO 015 §43 permits deriving them but they
  never replace the descriptive report) → deferred.

## Open questions

- Confirm exact **ECCD band abbreviations/labels** + per-domain item lists against the official
  *"Tracking Our Progress: Kindergarten!"* guide when implementing.
- Confirm the **parent "signature" = in-app acknowledgement** per term is acceptable (vs. purely
  informational, with signing done on a printed copy).
