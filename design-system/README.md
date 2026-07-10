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

## Still to define

- **Spacing** scale conventions beyond Tailwind defaults, **elevation**/shadow scale.
- Whether this palette is final or provisional — revisit once more of the app is built out.
