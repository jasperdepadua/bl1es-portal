# Design + Content Audit — full current UI surface

> **Status:** Produced by `ui-ux-critic` (visual/interaction design) and `content-reviewer`
> (copy/wording) scanning every shipped screen: `LoginPage`, `portal-shell`, `DashboardPage`,
> `SettingsPage`, both Management pages, `brand-logo`, and the shadcn primitives.
>
> **Resolution history:**
> - `chore/ui-infra-cleanup` — shared-infrastructure items (`--primary` token contrast,
>   `portal-shell` nav/modal behavior) + explicit cleanup requests (dead nav items, help-center
>   block, topbar search).
> - Second pass (three parallel `frontend-engineer` dispatches: Settings, Dashboard,
>   Login+portal-shell+Management) — everything else, at "content/design fixes only" depth: no
>   Supabase wiring beyond the identity-display fix in item M4 below (explicitly scoped that way,
>   see the decision below).
>
> **Remaining, deliberately open** — architectural/systemic items that need a dedicated decision or
> a future sub-project, not a content-cleanup fix:
> - **Canonical interactive component** — hand-rolled Tailwind vs. the unused shadcn `Button`/`Card`
>   primitives. `cursor-pointer` is now baked into both, so that symptom no longer forces the
>   decision.
> - **On-tint contrast dedicated pass** — `text-primary` on `bg-primary/10` is now 4.09:1 (was
>   ~2.6:1), clears the 3:1 floor but still short of 4.5:1 for small text. Needs a dedicated
>   `*-foreground`-on-tint token, following the `--success-foreground` precedent.
> - **`portal-shell`'s full role-gated IA** — dead links are gone, but the complete per-role nav
>   from `specs/navigation.md` (Attendance, Academics, Reports) can't land until those sub-projects
>   exist.
> - **Tap-target minimum** — not formally enforced app-wide; the critic noted most controls already
>   clear the hard a11y floor (24px), so this is a polish item, not a blocker.
> - A few Dashboard mock-data labels ("Today's Classes" stat, "My Subjects" heading) still say
>   "class(es)" where the spec's canonical entity is "Section" — left alone since that whole panel
>   is confirmed mock content pending Dashboard's own sub-project.

---

## Part 1 — Visual & interaction design (`ui-ux-critic`)

All **Blocking** and **Major** findings are resolved:

- ✅ **B1** — `--primary` darkened to `#1b72de` (4.66:1 with white, was 2.76:1). Mirrored to
  `--ring`/`--chart-1`/`--sidebar-primary`/`--sidebar-ring`.
- ✅ **B2** — Settings' `Field`/textarea now use `useId()` for real `htmlFor`/`id` pairing.
- ✅ **B3** — topbar search removed entirely (moot).
- ✅ **B4** — `useModalBehavior` promoted to `src/hooks/`, wired into the mobile nav drawer.
- ✅ **M1** — Dashboard's `chart-4`/`chart-5`-as-text-color replaced with `success-foreground` /
  folded into the existing `secondary` tone.
- ✅ **M2** — Login hero gets `hidden lg:flex`; mobile opens directly on the form.
- ✅ **M3** — `cursor-pointer` added everywhere it was missing: Login, Dashboard, Settings,
  `portal-shell`, Management, and the shadcn `Button` primitive's `buttonVariants`.
- ✅ **M4** — Dashboard's greeting and Settings' Profile identity card now both read from
  `useProfile()` instead of hardcoded "Ms. Reyes" — matches the topbar. (The *editable* Profile
  fields below the identity card remain static `defaultValue`s — full data-wiring was explicitly
  scoped out this round, see the resolution history above.)
- ✅ **M5** — Dashboard's `<PortalShell>` title is now the neutral `"Dashboard"`; the in-body
  welcome banner is the single real greeting (personalized) + summary line.

**Minor/taste** — all resolved except the tap-target minimum (see "deliberately open" above):
sub-12px fonts floored at `text-xs`; false hover-lift removed from non-clickable subject cards;
dead/stub controls (Remember me, Forgot password, Settings Save) now honestly `disabled` rather than
silently inert; the three selected-state visual languages (pill/solid-fill/underline) documented as
an intentional sanctioned set in `design-system/README.md` rather than unified into one; the phantom
spacer `<div>` in Settings removed; notification/avatar `aria-label`s now describe what's shown;
the logout async-race was already fixed in the first pass.

**Design-system gaps** — all resolved/documented except the two items called out as deliberately
open above (canonical component, on-tint contrast). Type-scale floor, the sanctioned selected-state
set, and the elevation/`Card` question (moot — confirmed unused anywhere) are now written into
`design-system/README.md`.

---

## Part 2 — Content & copy (`content-reviewer`)

All **Blocking** and **Moderate** findings are resolved:

- ✅ **1** — Settings trimmed to exactly the two spec'd sections (Profile, Security); Notifications/
  Preferences/Two-step-verification removed entirely rather than left as copy implying they work.
- ✅ **2** — "Quarter" → "term" (Dashboard, 3 instances).
- ✅ **3** — "Assignments" dropped from the Login hero copy (nav item was already removed in the
  first pass).
- ✅ **4** — Adviser-label format converged to the spec's canonical `"Adviser · {GradeLevel}–
  {Section}"` pattern in both `SectionDetailPage.tsx` and `SettingsPage.tsx`.
- ✅ **5** — "Log out" → "Sign out", matching "Sign in".
- ✅ **6** — "Student ID" → "Student Number" (Login), matching the term used everywhere else
  (Management UI, the `student_number` DB column, the specs).
- ✅ **7** — "Grades" → resolved as a side effect: the nav item was removed in the first pass, and
  Settings' "Grade updates" toggle is gone with the whole Notifications tab.
- ✅ **9, 23** — Help-center block removed entirely (moot).
- ✅ **10–14** — `SectionDetailPage.tsx`'s generic title, "Unassigned" inconsistency, Enroll/
  Unenroll casing, Settings' scope-overselling subtitle, and the "safe and sound" idiom are all
  fixed.
- **8** — `portal-shell`'s nav no longer has dead links (fixed in the first pass), but the *full*
  spec'd per-role IA stays open per the note above — that's not a content fix, it's future
  sub-projects.

**Minor/taste** — all resolved: brand-logo now says "...Elementary School"; the roster search
placeholders use the real "…" character (matching the rest of the app) instead of literal dots;
"See all"/"View all" unified to "View all"; the enroll dialog's verb now matches its own title;
"Search by name" unified across the roster filter and picker dialogs; the redundant "class
sections" phrasing fixed to "sections"; "discrete" softened to "separate"; the MAPEH mock-data split
merged into one entry. Item 20 (Change/Assign vs. Change Adviser/Assign Adviser) was intentionally
left as-is per the critic's own note — defensible given the space-constrained context.

**Terminology drift** — all six clusters (Adviser label, Sign in/Log out, Student ID/Number,
Grades/Progress Report, Class/Section, Quarter/Term) are resolved, with the exception of a couple of
low-priority Dashboard mock-data labels noted above.
