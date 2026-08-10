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
- **Modal/dialog pattern** (no shadcn Dialog primitive installed yet — plain Tailwind):
  `fixed inset-0 z-50` wrapper, `bg-foreground/40` backdrop (click to close), `rounded-3xl border
  border-border bg-card shadow-xl` panel, `role="dialog"` + `aria-modal="true"`. Behavior every new
  dialog must replicate: focus the first control on open, trap Tab within the dialog, restore focus
  to the trigger on close, lock background scroll, close on Escape. **Don't re-derive any of this
  per dialog** — use the shared building blocks in `src/features/management/components/`:
  - `useModalBehavior` (`src/hooks/use-modal-behavior.ts`) — the focus-trap/Escape/scroll-lock hook
    itself.
  - `DialogShell` (`dialog-shell.tsx`) — the backdrop + panel + header (title/description/close
    button) chrome. `FormDialog` and `PickerDialog` both compose this; don't hand-roll the
    header/backdrop/panel markup again for a third dialog shape — extend `DialogShell` or compose
    it, the way those two do.
  - `FormDialog` (`form-dialog.tsx`) — adds a `<form>` body + error slot + Cancel/Save footer on
    top of `DialogShell`. Use for every create/edit form.
  - `ConfirmDialog` (`confirm-dialog.tsx`) — title/description + Cancel/Confirm footer, no form.
    Takes a `tone` prop: `'destructive'` (default — red confirm button) for irreversible/risky
    actions (deactivate, unenroll); `'primary'` (blue confirm button) for confirmations that are
    just an important state change, not a danger (e.g. "set as current school year"). Picking the
    wrong tone reads as either scary-for-no-reason or not-serious-enough — match the actual stakes.
  - `PickerDialog` (`picker-dialog.tsx`) — generic search + single-select list (e.g. picking a
    teacher to assign, a student to enroll). Generic over `{ id, name }`.
  - `FormSelect` (`form-dialog.tsx`) — **always use this for `<select>` elements, never a raw
    `<select>`.** The native dropdown arrow (`appearance: auto`) doesn't match this app's lucide-icon
    language and renders inconsistently across browsers; `FormSelect` replaces it with a properly
    sized/positioned/colored `ChevronDown`, dims placeholder text like a real input does, and
    forwards its ref for `react-hook-form`'s `register()` spread.
  - `FORM_INPUT_CLASSNAME` / `FORM_FIELD_ERROR_CLASSNAME` (`form-dialog.tsx`) — the shared
    text/number/date input styling and field-validation-error text styling. Import these instead of
    re-declaring the class string per page — four forms already drifted (`px-3.5` vs `px-4`,
    `text-xs` vs `text-sm` errors) before this was a shared constant.
- **Inline mutation-error banner** (`src/components/inline-mutation-error.tsx`) — for surfacing a
  failed mutation that has no dialog to show an error in (e.g. one-click reactivate/reorder actions,
  which are deliberately confirm-free). Also used for the Login and Accept-Invite error banners. Not
  a toast/notification system — just this one banner shape, rendered inline near the action that
  failed.
- **Icon pairs for state-toggle actions — pick from this set, don't invent a new pair per screen:**
  - **Deactivate / Activate:** `Power` (deactivate) / `RotateCcw` (activate/reactivate). Reactivating
    is a plain one-click action with no confirm dialog (it's the safe direction); deactivating goes
    through `ConfirmDialog` with `tone="destructive"`.
  - **Assign / Change:** when a relationship is unset (no adviser, no subject teacher), use a
    **primary filled button** (`bg-primary text-primary-foreground`) with `UserPlus` and the label
    "Assign X" — this is a real call-to-action flagging a gap that needs filling. Once set, switch to
    a **neutral outline button** (`border-border bg-background`) with `RefreshCw` and the label
    "Change X" — a routine, lower-stakes action. Apply this pair consistently everywhere an
    assignment can be empty or filled (adviser, subject teacher, and any future "assign someone to
    this slot" pattern) — don't leave one context flat (same style regardless of state) while
    another distinguishes empty-vs-filled; that reads as arbitrary, not intentional.
- **Empty-state template** (list pages with zero rows): centered `flex flex-col items-center` block,
  `size-14 rounded-2xl bg-primary/10 text-primary` icon tile, `font-display text-lg font-extrabold`
  heading, `text-sm text-muted-foreground` subtext, and — if the page has a header "Add X" button —
  the **same button repeated inside the empty state** (primary-filled, `Plus` icon). Every list page
  has the header button already; repeating it in the empty state isn't redundant, it's the more
  discoverable one when there's nothing else on the page to look at.
- **`font-display` (Baloo 2) and dashes don't mix.** A raw en-dash "–" or em-dash "—" renders
  visibly too high relative to the surrounding text baseline in Baloo 2 at heading weight/size — a
  font-specific glyph-metrics quirk, confirmed by rendering it and measuring. **Never put a literal
  dash inside `font-display` text.** Use a middot "·" instead (it's metrics-designed to sit centered,
  and renders correctly in both Baloo 2 and Nunito) — matching the separator already used for
  compound labels like "Adviser · Grade 4–Mabini" (note: the *inner* hyphen there is fine because
  that whole label renders in `font-sans`/Nunito, not `font-display`). If you need a literal string
  dash for some reason, wrap it in `font-sans` explicitly rather than letting it inherit Baloo 2.
- **`role="link"` rows activate on Enter only, not Space** (native `<a>` semantics — Space is
  reserved for page-scroll). If a row-as-button interaction pattern is ever wanted instead, use
  `role="button"` and accept Space too; don't mix the two semantics on one element.

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
- **On-tint text contrast — resolved for badges/avatars, still open for icons.** `text-primary` on
  `bg-primary/10` is 4.08:1, `text-muted-foreground` on `bg-muted` is 3.18:1 — both clear the 3:1
  floor for large text/icons but fail 4.5:1 for small text. Added two dedicated tokens in
  `globals.css`, following the `--success-foreground` precedent: `--primary-foreground-tint`
  (`#165db6`, 5.60:1 on `bg-primary/10`) and `--muted-badge-foreground` (`#6e6a5e`, 4.63:1 on
  `bg-muted`). `Badge`'s `primary`/`muted` tones and `Initials` now use these instead of the plain
  tokens — every badge and avatar-initial in the app inherits the fix automatically. Icon-tile
  usages of `bg-primary/10 text-primary` (an icon, not text, inside the tint) are correctly left
  alone — icons only need the 3:1 floor, which was already clear. **No dark-mode equivalents were
  added** — dark mode isn't an active feature of this app (the `.dark` block in `globals.css` is
  unused shadcn scaffold); add them if/when dark mode actually ships, rather than guessing values
  now for a mode nothing renders in.
- **Destructive text included in the same fix.** `text-destructive` (`#ef4444`) is only ~3.76:1 on
  white — below the 4.5:1 floor for small text, same failure mode as `text-primary`/
  `text-muted-foreground` above. Added `--destructive-foreground` (`#d91313`, 5.18:1 on
  `card`/`background`, 4.54:1 on the `bg-destructive/10` tint), following the same hue-preserving
  precedent. `Badge`'s `destructive` tone, `FORM_FIELD_ERROR_CLASSNAME`, `ConfirmDialog`'s
  destructive confirm button, and every hand-rolled error-message/banner text in the app now use
  `text-destructive-foreground`. Icon-only and background-fill usages of `text-destructive`/
  `bg-destructive`/`border-destructive` (icon tiles, hover-state icon color on row actions) are
  correctly left alone — same icon/text distinction as above.
