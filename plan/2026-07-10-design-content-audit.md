# Design + Content Audit — full current UI surface

> **Status:** Findings only, not yet triaged. Produced by `ui-ux-critic` (visual/interaction design)
> and `content-reviewer` (copy/wording) scanning every shipped screen: `LoginPage`, `portal-shell`,
> `DashboardPage`, `SettingsPage`, both Management pages, `brand-logo`, and the shadcn primitives.
> The user reviews and marks a decision per finding (`Fix now` / `Defer` / `Won't fix`) — nothing
> here is applied yet.

---

## Part 1 — Visual & interaction design (`ui-ux-critic`)

### Blocking

- **B1. White text on solid `--primary` (#4f9dff) = 2.76:1 — fails WCAG AA, token-level, app-wide.**
  Every primary button/active-nav/avatar with white text/icon fails contrast, including the
  Management buttons already reviewed once and the shipped `Button` `default` variant. Distinct
  from (more severe than) the two on-tint contrast items already logged in
  `design-system/README.md`. Fix candidates verified: `#1e6fe0` (4.77:1) or blue-600 `#2563eb`
  (5.17:1) — or add a separate `--primary-strong` token for text-bearing surfaces and keep `#4f9dff`
  for large decorative fills only.
- **B2. Settings form inputs have no label association** (`SettingsPage.tsx` `Field` component +
  About textarea) — zero `htmlFor`/`id` pairing app-wide in that file. Login does this correctly;
  Settings regressed from it.
- **B3. Topbar search has no accessible name** (`portal-shell.tsx` — placeholder only, no
  `aria-label`). Management's own search inputs already do this correctly — inconsistent.
- **B4. Mobile nav drawer has none of the mandated modal behavior** (`portal-shell.tsx`) — no focus
  trap/initial-focus/Escape/scroll-lock/focus-restore/`role="dialog"`, despite being a modal-scrim
  overlay. `useModalBehavior` (currently local to `SectionDetailPage.tsx`) should be promoted to a
  shared hook now that a second surface needs it.

### Major

- **M1.** Dashboard uses raw `chart-4`/`chart-5` tokens as text color (1.73:1 / 2.39:1) — the exact
  "chart fill used as foreground" mistake the design system already warns against.
- **M2.** Login hero eats the whole first mobile screen — no `hidden lg:flex`, so mobile users must
  scroll past a full illustration panel to reach the form.
- **M3.** Systemic missing `cursor-pointer` on native `<button>` across every *not-yet-reviewed*
  screen (Login, portal-shell, Dashboard, Settings — 19 buttons) plus the shipped `Button`
  primitive itself. Confirms the earlier recommendation: fix belongs in `buttonVariants`, not
  per-component.
- **M4.** Dashboard/Settings show hardcoded "Ms. Reyes" while the topbar (via real `useProfile`)
  shows the actual logged-in user — identity mismatch for any non-Reyes account.
- **M5.** Dashboard has two stacked greeting blocks (topbar + a redundant welcome banner) —
  flattens hierarchy; every other screen uses the topbar title as a page name, not a greeting.

### Minor / taste

Sub-12px hardcoded font sizes on Dashboard badges; false hover-affordance on non-clickable subject
cards; several dead/stub controls presenting as live (Remember me, Forgot password, `href="#"` nav
items, Settings Save); inconsistent tap-target sizes (28–40px vs. a 44px touch floor); three
different "selected" visual languages (pill / solid-fill / underline) with no defined pattern; a
phantom spacer `<div>` in Settings' grid; notification unread-state and mobile avatar not exposed to
assistive tech; logout races an async mutation against a `<Link>` navigation. Full detail in the
agent's original report if needed — ask and I'll paste the rest.

### Design-system gaps to extend (not component-level fixes)

1. Expand the logged on-tint note to cover solid `--primary`/`--accent` + white (not just tints).
2. Contrast-tuned foreground tokens if Dashboard's mint/purple categories are kept.
3. Type-scale floor (12px minimum) + named badge/eyebrow sizes.
4. One canonical "selected/active" treatment (or a small sanctioned set per context).
5. A tap-target minimum (44px recommended) for icon-buttons.
6. Promote `useModalBehavior` to a shared hook; clarify the modal pattern covers *any* scrim
   surface, including nav drawers.
7. Pick one elevation/shadow language (border-based app cards vs. ring-based shadcn `Card`).
8. A placeholder-text-color convention (Login uses `/70` opacity, elsewhere uses full).

---

## Part 2 — Content & copy (`content-reviewer`)

### Blocking

- **1. Settings ships fully-interactive Notifications/Preferences/2FA tabs the spec says don't
  exist in v1** (`specs/settings.md` — v1 is Profile + Security only). The copy actively implies
  capability the product doesn't have (a live-looking "Off" 2FA toggle, a Save button that implies
  it persists all of it).
- **2. "Quarter" is factually wrong** — the school runs **Terms** (3 terms, SY 2026-2027) per
  `specs/reference-findings.md`/`auth-and-core-entities.md`. Appears 3× in `DashboardPage.tsx`.
  Fix: "This term" / "Class progress this term."
- **3. "Assignments" is promised on the login screen and in nav** for a feature `specs/dashboard.md`
  explicitly drops from v1 scope — on the most mature, closest-to-shipping screen. Fix: drop
  "assignments" from the login hero copy and reconsider the nav item.

### Moderate

- **4. Adviser relationship-label format has 3 different renderings**, none matching the spec's own
  canonical example (`"Adviser · Kinder–Matulungin"`, en-dash) — `SectionDetailPage.tsx`,
  `SettingsPage.tsx` bio, and a third variant introducing "Homeroom adviser" (used nowhere else).
- **5. "Sign in" (×3) vs. "Log out" (×1)** — mismatched verb pair; recommend "Sign out."
- **6. "Student ID" (login label) vs. "Student Number" (everywhere else, incl. the DB column
  name)** — flagged as a spec self-conflict (the auth spec's own "resolved" follow-up note
  introduced "Student ID" without reconciling it against the data-model vocabulary used
  everywhere else). Worth revisiting the spec, not just the label.
- **7. "Grades" (nav + Settings) contradicts Kinder's actual descriptive, non-numeric "Progress
  Report"** per `specs/assessment.md`. Fix: rename to "Progress Report."
- **8. `portal-shell`'s nav array doesn't reflect the spec'd IA at all** — flat, non-role-gated,
  five of seven items are dead `href="#"` links to features not in any spec (My Classes, Schedule,
  Assignments, Grades, Messages). Only "Management ▸ Sections" is real. Surfaced distinctly because
  this file was treated as "already mature" going into the audit — it isn't, content-wise.
- **9. Help-center copy isn't role-aware** — "Ask your teacher" renders identically for the
  Principal role too.
- **10. `SectionDetailPage`'s browser/page title is generic** ("Section Detail") despite the real
  section name being available and prominent two lines later.
- **11. "Unassigned" vs. "No adviser assigned"** — same missing-adviser state, two different
  fallback strings on the same page.
- **12. Settings subtitle oversells v1 scope** ("profile, notifications, and portal preferences" —
  v1 is profile + password only).
- **13. "Keep your account safe and sound"** — idiom-heavy, too playful for a screen every role
  (including superadmin/teacher) shares; recommend "Update your password and manage account
  security."
- **14. Enroll/Unenroll mismatched casing** — "Enroll Student" (Title Case) vs. "Unenroll student"
  (sentence case) for mirror actions on the same table.

### Minor / taste

"Bayanluma 1 Elementary" (brand-logo) vs. "...Elementary School" (everywhere else); literal `...`
vs. real `…` ellipsis inconsistency; "See all" vs. "View all" for the same affordance on one page;
enroll dialog description verb mismatch ("Add" vs. its own "Enroll" title); "Search by name" vs.
"Filter by student name" for the same interaction; "Change"/"Assign" (Subjects tab) vs. "Change
Adviser"/"Assign Adviser" (Adviser tab) — likely intentional (space-constrained), flagged for
parallelism only; redundant "class sections" phrasing; MAPEH split into two mock subject rows
(very low priority — that whole panel is confirmed dropped for v1 anyway).

### Terminology drift, grouped

**Adviser label format** (3-way), **Sign in/Log out**, **Student ID/Student Number**,
**Grades/Progress Report**, **Class/Section** (Login, nav, Dashboard, and SectionsListPage all lean
on "class(es)" where the spec's canonical entity is "Section"), **Quarter/Term**.

---

## What's already good (both reports agree Management is the strongest work)

- Tone-by-audience execution is correct: Login/Dashboard/Settings read playful; Management reads
  professional — the intended "storefront vs. back office, same brand" split, done right.
- `SectionsListPage`/`SectionDetailPage` are the strongest-written *and* best-designed files in the
  app — vocabulary tracks the specs almost word-for-word, and the a11y/focus work from the prior
  review round all held up on spot-check.
- Real accessibility care already present in several places: Management's dialog focus-trap,
  ARIA tab wiring, `th scope`, keyboard-operable list rows, Settings' `Toggle` (`role="switch"`),
  Login's correctly-labeled inputs.
- Error/empty-state mechanics are clean and consistent app-wide, and never leak implementation
  detail (matches `CLAUDE.md`'s security guidance on generic error messages).
- Careful pluralization, matching `aria-label`s to visible text, and the `ROLE_LABELS` mapping
  (superadmin→Principal etc.) all show real attention to detail already.
