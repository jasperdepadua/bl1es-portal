# Reference document findings

Raw, factual extraction from the two source documents provided for this project. This is **not**
yet our own decided business rules — it's the input to them. As we brainstorm and lock actual
app behavior, split relevant pieces out into their own `specs/<domain>.md` files (e.g.
`grading.md`, `attendance.md`, `enrollment.md`) and cite back to this doc or the source PDF.

Source PDFs (read-only references, not edited):
- `Classroom Orientation - KINDER.pdf` — Bayan Luma I Elementary School, Kindergarten section
  "Matulungin," SY 2026-2027 (29 pages)
- `DO_s2026_015r.pdf` — DepEd Order No. 015, s. 2026 (57 pages of actual content, despite the
  242-page file report — trailing pages just re-render the final content)

---

## DepEd Order No. 015, s. 2026

**Title:** "Revised Guidelines on Classroom Assessment, Grading System, and Awards and Recognition
for the K to 12 Basic Education Program"

**Purpose:** Implements RA 10533 and the Revised K-10/Strengthened SHS Curriculum. Effective SY
2026-2027, applies to all public schools nationwide. Repeals DO No. 8 s.2015 and DO No. 36 s.2016.
(pp. 1-4)

**Scope note:** Does NOT cover enrollment procedures, class/section size/organization, or detailed
school-calendar dates — those aren't addressed in this order.

### Grading system & computation (Section VI, pp. 10-14; Annex D, pp. 35-39)
- **KS1 (Kindergarten-Grade 3):** descriptive, non-numeric. Kindergarten uses CO/DV/BG (Table 7,
  p.10); Grades 1-3 use A-E letter grades (Table 8, p.11). Phased transition to fully descriptive
  by SY 2028-2029 (Table 12, p.14).
- **KS2-KS4:** numerical grading (0-100), weighted from Written/Oral Works, Product/Performance
  Tasks, and Examinations (STs + TE); weights vary by learning area (Tables 9-10, pp.11-12).
- **Computation:** Raw Score → Percentage Score (RS / Highest Possible × 100) → Weighted Score
  (PS × weight%) → sum = Initial Grade → transmutation table (SY2026-2027 only, Table 4, p.37) →
  Term Grade.
- **Passing = 75**; default minimum reportable grade = 60 (pp.12, 39).
- Zero-based grading (no transmutation) begins SY 2027-2028 for KS2-KS4 (pp.12, 38).
- Final Grade = average of term grades; General Average = average of Final Grades (p.13).
- Formative assessment is never used for grade computation (p.6, ¶15).

### Attendance (pp. 16, 40)
- Absences exceeding 20% of prescribed class days → failing grade, no credit (School Head may
  grant documented exemptions).
- Teachers must intervene by end of Term 1 or ~12 absences, coordinating with parents/guardians.
- Progress/Performance Reports must include attendance data each term.

### Promotion, retention, intervention (Section VIII, pp. 15-16)
- **KS1:** non-punitive, developmentally based; no retention solely on age or a single assessment.
- **KS2-KS4:** promoted upon passing all learning areas. Failing ≤2 areas → Summer Remedial Class
  → Recomputed Final Grade (≥75 = promoted); still failing 1-2 after SRC → conditional promotion
  with "back subjects" (max 1/term); failing >2 areas → retained in grade level.
- SHS: failing a prerequisite subject blocks enrollment in the next-level subject until cleared.

### Report cards / documentation (pp. 14-15, 41-49)
- **SF9** = Learner's Progress/Performance Report (narrative for KS1; numerical for KS2-KS4).
  Templates: Kindergarten Progress Report (Annex E), Grades 1-3 Progress Report + PACE Form
  (Annex F), Grades 4-12 Performance Report (Annex G) — all include attendance and
  parent/guardian signature lines.
- **SF10** = Learner's Permanent Academic Record (referenced re: awards, p.54).
- Teachers retain supporting assessment records for ≥1 school year (p.15).

### Parent/guardian roles (pp. 6, 8, 16, 41-49, 54)
- Formative feedback must reach both learners and parents/guardians.
- Parents consulted on retention decisions, disability accommodations, and attendance
  interventions.
- Progress reports require per-term parent/guardian signatures; schools must orient parents on
  grading/awards policies.

### Awards & recognition (Section IX, pp. 16-18; Annex H, pp. 50-55)
- **KS1:** no academic awards — only Character Traits Award and Perfect Attendance Award
  (non-academic).
- **KS2-KS4:** Academic Excellence Award (GA≥90, no Final Grade <80, no disciplinary records),
  plus Leadership Excellence, Excellence in a Specific Learning Area, and (Grade 12) Excellence in
  Work Immersion/Research/Design & Innovation, Special Recognition Awards (Table 13, p.17).
- Awards Committee (≥3 members): nominations May-August, deliberation February-March; protest
  window: 5 working days to file, 2 to resolve (Table 3, p.54; p.55).

### Digital tools / AI governance (pp. 8-10)
- AI use classified as **Prohibited** (exams/supervised work), **Limited** (grammar,
  brainstorming, must be disclosed), or **Guided** (complex tasks, KS3-KS4, documented).
- No personally identifiable learner data may be uploaded to AI platforms.
- **Official grade submission happens through DepEd's own LIS (Learner Information System)**,
  governed by a separate order (DO No. 6 s.2025).
  > ⚠️ Architectural implication: this portal is likely **not** the authoritative grade record —
  > it's a parent/teacher-facing layer on top of (or alongside) LIS. Needs an explicit decision
  > once we design the data model.

### Not relevant to this project (skimmed only)
Central/Regional/Division/School governance roles (pp. 18-20), monitoring/evaluation mechanisms
(p. 20), funding provisions (p. 20), bibliographic references (p. 21).

---

## Classroom Orientation - Kinder (Bayan Luma I Elementary School)

Kindergarten section "Matulungin," SY 2026-2027, DepEd Division of Imus City, Cavite.

### Daily schedule/routine (pp. ~18-22)
Two shifts, 180 minutes each, per DepEd Order No. 31 s.2012 and No. 10 s.2024:
- **AM ("Masayahin"):** 7:00-7:15 Meeting Time, 7:15-8:00 Circle Time 1, 8:00-8:15 Recess,
  8:15-8:25 Quiet/Nap, 8:25-9:05 Circle Time 2, 9:05-9:40 Indoor/Outdoor Play, 9:40-10:00
  Wrap-Up, 10:00 Dismissal.
- **PM ("Masinop"):** mirrors AM shift, ~11:00-2:00.
- Blocks: Arrival/Free Play, Meeting Time (attendance/weather chart), Circle Time 1
  (story/read-aloud), Circle Time 2 (language, math, science, music, arts integration), Wrap-Up
  (recall day, think & share, apply at home), Dismissal (packing away, safety reminders).

### Subjects/learning areas (pp. ~15-17)
Literacy and numeracy focused: pre-reading (phonological awareness, book/print knowledge, letter
knowledge), pre-writing (tracing/writing name and letters), foundational math (sizes, length,
weight, colors, shapes, patterns, sorting). Term themes: T1 "Knowing Who We Are and Our
Families," T2 "Exploring Our Community," T3 "Caring for Our Community and Our Environment."

### Attendance (p. ~28)
- Max absences = 20% of total school days = **40 absences**.
- **4Ps beneficiaries:** only 3 consecutive absence days allowed per month; exceeding this →
  automatic removal from the 4Ps list.

### Grading/assessment (pp. ~23-27) — confirms non-numeric for K
- ECCD Assessment across 8 domains: Gross Motor (13 items), Fine Motor (11), Self-Help (13),
  Self-Help/Toilet Training (14), Receptive Language (5), Expressive Language (8), Cognitive (21),
  Social-Emotional (24).
- Descriptive ratings: SSDOD (Significant Delay), SSIDOD (Slight Delay), AD (Average
  Development), SSAD (Slightly Advanced), SHAD (Highly Advanced).
- Progress Report Card: the deck renders the scale informally in Filipino (Nagsisimula / Pag-unlad /
  Konsistent). **Verified against DO 015 (Table 7, p.10): the official scale is CO / DV / BG**
  (Consistent / Developing / Beginning).
- No formal academic awards for Key Stage 1 — certificates recognize effort/character milestones
  instead (consistent with the DepEd Order above).

> **Verified (primary source) — two distinct instruments** (detailed in `assessment.md`):
> 1. **Kindergarten Progress Report** (DO 015 Annex E) = the *grading* — a competency checklist over
>    **4 curriculum domains** (Sensory-Motor, Socio-emotional, Cognitive, Language/Literacy), rated
>    **CO/DV/BG per term (T1/T2/T3)**, with per-term teacher comments, parent signature, and a
>    per-term/month attendance record.
> 2. **ECCD Checklist** = the *developmental screening* — the **8 domains** listed above, bands
>    SSDOD→SHAD, done baseline + endline; exact items/norms live in the *"Tracking Our Progress:
>    Kindergarten!"* guide (DO 015 §42).

### Parent/guardian communication (pp. ~2, 21, 30-31)
- Parents not allowed inside the classroom during class hours.
- Schedules (e.g. ECCD assessment) posted via class group chat.
- First-day crying is normal/expected — guidance given to parents.
- Parents must designate and coordinate who drops off/picks up the child (never leave child with
  unfamiliar people).
- **"10-Minute Rule":** arrive 10 minutes before class start/dismissal.

### Classroom rules/routines (pp. ~1, 4)
- Posted values: "Malinis, Tahimik, Magalang" (Clean, Quiet, Respectful).
- Bathroom-use routine (6 steps): enter quietly, sit properly, flush, wash hands, dry with towel,
  exit properly.
- Cleanliness rules: wipe shoes on doormat, "Basura ko, Uwi ko" (bring trash home in a bag or
  place food waste back in lunchbox).

### Enrollment requirements (p. ~5)
PSA Birth Certificate required; if unavailable, accepts Local Civil Registry Birth Certificate,
Barangay Certificate, or Baptismal Certificate.

### Materials/requirements for students (pp. ~3, 32)
Bring own baon (packed lunch) and water daily; teach proper opening/closing of lunch containers;
bring a towel; label all belongings.

### Roles (p. ~2)
"Guro" (teacher/adviser) and "magulang" (parents) explicitly addressed with distinct
responsibilities — teachers manage classroom/instruction; parents ensure attire, safety,
punctuality, and emotional support.

### School calendar (pp. ~11-14)
Shifted from 4-quarter to **3-term system** for SY 2026-2027: Term 1 (June 8-Sept 15, 2026),
Term 2 (Sept 16-Dec 18, 2026), Term 3 (Jan 4-Apr 8, 2027); 201 total class days. Key dates: ECCD
Assessment June 10-11, 2026; Independence Day (no class) June 12, 2026; Protected Instructional
Block June 15, 2026.

### Other notes
Canteen sales support non-MOOE school expenses; uniform encouraged, parents asked to dress
decently during drop-off/pick-up; safety protocol includes teaching the child personal info
(name, age, address, parents) and street-crossing skills.
