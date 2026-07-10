# design-system/

The visual foundation of the portal.

## Established

Source of truth lives in [`src/styles/globals.css`](../src/styles/globals.css) as Tailwind v4
`@theme` CSS variables. Initial palette/type came from a v0-generated mockup and was ported in as-is.

- **Vibe:** warm, playful, rounded — elementary-school friendly.
- **Fonts:** Nunito (body, `font-sans`) + Baloo 2 (headings, `font-display`/`font-heading`).
- **Palette:** cream background (`#fff9f2`), sky blue primary (`#4f9dff`), sunny yellow secondary
  (`#ffd166`), coral accent (`#ff6b6b`).
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
- **Modal/dialog pattern** (no shadcn Dialog primitive installed yet — plain Tailwind, see
  `useModalBehavior` in `src/features/management/pages/SectionDetailPage.tsx`): `fixed inset-0 z-50`
  wrapper, `bg-foreground/40` backdrop (click to close), `rounded-3xl border border-border bg-card
  shadow-xl` panel, `role="dialog"` + `aria-modal="true"`. Behavior every new dialog must replicate:
  focus the first control on open, trap Tab within the dialog, restore focus to the trigger on
  close, lock background scroll, close on Escape. Reuse `useModalBehavior` rather than re-deriving
  this per dialog.

## Still to define

- **Spacing** scale conventions beyond Tailwind defaults, **elevation**/shadow scale.
- Whether this palette is final or provisional — revisit once more of the app is built out.
- **Canonical interactive component.** Buttons/inputs/cards across the app (login, dashboard,
  portal-shell, and now Management) are hand-rolled Tailwind rather than the shipped shadcn
  `Button`/`Card` primitives, so there are effectively two parallel systems with different radius/
  height scales. Decide: standardize on the shadcn primitives (extending `Button` with the sizes
  these screens want), or formally bless the hand-rolled pattern here — either way, bake
  `cursor-pointer` into whichever wins so it stops being a per-component fix (Tailwind v4 Preflight
  doesn't add it to `<button>`).
- **On-tint text contrast, app-wide.** `text-primary` on `bg-primary/10` and `text-muted-foreground`
  on `bg-muted` both measure under WCAG AA (4.5:1) for small text, and both are used broadly (badges,
  avatar initials, subtitles) across screens already shipped. Worth an app-wide pass once the
  canonical-component question above is settled, rather than patching combo-by-combo.
