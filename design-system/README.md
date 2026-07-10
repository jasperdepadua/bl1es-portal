# design-system/

The visual foundation of the portal.

## Established

Source of truth lives in [`src/styles/globals.css`](../src/styles/globals.css) as Tailwind v4
`@theme` CSS variables. Initial palette/type came from a v0-generated mockup and was ported in as-is.

- **Vibe:** warm, playful, rounded — elementary-school friendly.
- **Fonts:** Nunito (body, `font-sans`) + Baloo 2 (headings, `font-display`/`font-heading`).
- **Palette:** cream background (`#fff9f2`), sky blue primary (`#1b72de`), sunny yellow secondary
  (`#ffd166`), coral accent (`#ff6b6b`). Primary was darkened from the original v0 value (`#4f9dff`,
  2.76:1 with white — failed WCAG AA) to `#1b72de` (4.66:1) — same hue, slightly less saturated,
  still reads as the same sky blue. `--ring`, `--chart-1`, `--sidebar-primary`, and `--sidebar-ring`
  moved with it since they mirrored the same value.
- **Radius:** `1rem` base (very rounded — cards, inputs, buttons all soft).
- **Components:** shadcn/ui (Radix base) themed via the above CSS variables.
- **Tone scales with audience, not with page.** Same tokens (palette/fonts/radius) everywhere, but
  the *density and register* shift by who's using the screen: illustrated, spacious, playful for
  student/parent-facing screens (login, dashboard); dense, efficient, professional for
  superadmin/teacher operational screens (Management CRUD, gradebooks). Think "same brand, back
  office vs. storefront" — not a different theme, a different register of the same theme.
- **Interactive affordance:** `cursor-pointer` only on genuinely interactive custom elements
  (a `<div>`/`<li>` acting as a button or clickable card) — never applied blanket to non-interactive
  elements just because they're inside a list or table row.
- **Status/semantic text colors:** don't use a `chart-*` token as text color — those are chart
  *fills*, not contrast-tuned for text. Use a dedicated `*-foreground` token instead (e.g.
  `--success-foreground`, added for the Management roster's Active/Inactive badge) and verify
  ≥4.5:1 contrast on `card`/`background` before adding a new status color.
- **Type-scale floor.** `text-xs` (12px) is the minimum text size anywhere in the app — this
  audience includes young students and guardians who may not be tech-savvy; don't reach for
  arbitrary-value sizes below it (e.g. `text-[10px]`, `text-[11px]`) for badges/eyebrows. If a
  smaller visual weight is needed, use `text-xs` with lighter color/weight, not a smaller size.
- **Selected/active-state treatment is a small sanctioned set, not one universal pattern** — a
  solid-fill (`bg-primary text-primary-foreground`) for sidebar/list nav, an underline for tabs, and
  a pill/segmented-control look for a binary role/mode toggle (e.g. the login Student/Teacher
  switch) are all intentional, distinct-by-context choices. Don't invent a fourth treatment; pick
  whichever of these three matches the control's shape (list item vs. tab vs. binary switch).
- **Modal/dialog pattern** (no shadcn Dialog primitive installed yet — plain Tailwind, see
  `useModalBehavior` in `src/features/management/pages/SectionDetailPage.tsx`): `fixed inset-0 z-50`
  wrapper, `bg-foreground/40` backdrop (click to close), `rounded-3xl border border-border bg-card
  shadow-xl` panel, `role="dialog"` + `aria-modal="true"`. Behavior every new dialog must replicate:
  focus the first control on open, trap Tab within the dialog, restore focus to the trigger on
  close, lock background scroll, close on Escape. Reuse `useModalBehavior` rather than re-deriving
  this per dialog.

## Still to define

- **Spacing** scale conventions beyond Tailwind defaults, **elevation**/shadow scale. (The app's
  own border-based cards vs. the shadcn `Card` primitive's ring-based look would be a real clash if
  the primitive were adopted — moot for now since it isn't used anywhere; revisit alongside the
  canonical-component decision below.)
- Whether this palette is final or provisional — revisit once more of the app is built out.
- **Canonical interactive component.** Buttons/inputs/cards across the app (login, dashboard,
  portal-shell, and Management) are hand-rolled Tailwind rather than the shipped shadcn
  `Button`/`Card` primitives — confirmed neither primitive is actually imported anywhere yet, so
  this is a latent decision, not a visible clash today. `cursor-pointer` is now baked into both the
  `Button` primitive's `buttonVariants` *and* every hand-rolled button across the app, so that
  specific symptom no longer forces the decision — but the underlying question (standardize on the
  primitives with larger touch-friendly sizes, or formally bless the hand-rolled pattern and treat
  the primitives as not-yet-adopted) is still open. Revisit if/when a screen actually reaches for
  `Card`, or once enough hand-rolled duplication makes the primitives worth adopting.
- **On-tint text contrast, app-wide.** `text-primary` on `bg-primary/10` improved from ~2.6:1 to
  4.09:1 when `--primary` was darkened for the solid-fill fix above — clears the 3:1 floor (large
  text/icons) but still short of 4.5:1 for small text. `text-muted-foreground` on `bg-muted` is
  unaffected and still under AA. Both are used broadly (badges, avatar initials, subtitles) across
  screens already shipped. Worth a dedicated pass (likely a `--primary-foreground`-on-tint token,
  following the `--success-foreground` precedent) once the canonical-component question above is
  settled, rather than patching combo-by-combo.
