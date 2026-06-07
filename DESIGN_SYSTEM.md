# FitSpace — Design System & Build Instructions

This document translates the approved `fitspace-hybrid.html` mockup into a real design
system for the Next.js 14 + Tailwind + Supabase app. Reference this file (alongside
`SPEC.md` and `schema.sql`) at the start of every Claude Code session.

The mockup file (`fitspace-hybrid.html`) is the **visual source of truth**. When in doubt
about spacing, motion, or color, open it and match it. Do NOT copy its inline `<style>`
verbatim — port it into the Tailwind setup below.

---

## 1. Core Aesthetic — "Refined Virtual Closet"

The whole product is framed as a **wardrobe you can open and share**:

- **The feed IS a big shared closet.** Each post renders as a person's closet module —
  a wood-grain panel with their avatar + style persona, and garments "hanging on a rail"
  that gently drop on hover.
- **Peek into others.** Clicking a closet opens an overlay showing that person's
  wardrobe stats and the actual pieces inside, with a "follow their closet" action.
- **My Closet** is the user's own version: stat cards, drawers that slide open, and an
  AI gap-analysis card.

Tone: warm, tactile, grown-up. Muted oak + paper + a single rust accent. Editorial serif
for headings, clean grotesk for body. NOT cartoonish (no hard offset shadows, no candy
colors, no emoji, no bouncy display fonts) and NOT luxury-precious.

---

## 2. Design Tokens

Add these to `tailwind.config.ts` under `theme.extend`:

```ts
colors: {
  bg:        '#f3ede3', // warm paper — page background
  bg2:       '#ede5d8', // slightly deeper surface
  panel:     '#fbf8f2', // card / panel surface
  wood:      '#cbb595', // muted oak — closet modules & drawers
  'wood-dk': '#a8906c', // oak shadow / rail
  ink:       '#241f1a', // primary text & dark buttons
  'ink-soft':'#5a5046', // secondary text
  rust:      '#a8573a', // single warm accent (links, hovers, highlights)
  sage:      '#6f7a62', // secondary accent (brand labels etc.)
},
fontFamily: {
  serif: ['Fraunces', 'serif'],          // headings, numbers, closet names
  sans:  ['Hanken Grotesk', 'sans-serif'],// body, UI, buttons
},
borderColor: {
  line:      'rgba(36,31,26,.14)',
  'line-soft':'rgba(36,31,26,.08)',
},
borderRadius: { card: '14px', drawer: '12px', pill: '30px' },
```

Load fonts in `app/layout.tsx` via `next/font/google`:
```ts
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
```
Fraunces weights 400/500/600 (incl. italic), Hanken weights 400/500/600/700.

Apply as CSS variables on `<body>` so both Tailwind and any raw CSS can use them.

### Texture details (don't skip — they carry the warmth)
- **Grain overlay**: a fixed, full-screen SVG-noise pseudo-element at ~2.5% opacity.
  Put it in `globals.css` on `body::after` (copy the data-URI from the mockup).
- **Wood grain**: closet/drawer panels use a `repeating-linear-gradient` of faint
  vertical lines over the oak color. Copy from `.closet::before` / `.drawer::before`.

---

## 3. Motion Rules

All easing uses `cubic-bezier(.2,.8,.2,1)` for entrances, `cubic-bezier(.3,1.2,.5,1)`
for the springy garment/drawer movements. Keep durations 250–500ms.

- **Hero words**: stagger-rise on load (`@keyframes rise`, 22px up + fade), ~70ms apart.
- **Feed closets**: fade + 22px rise on scroll-in via `IntersectionObserver`,
  staggered by index. Hover = lift 5px + softer shadow; garments drop 6px (staggered).
- **Drawers**: `max-height` transition open/close; the `▾` arrow rotates 180°.
- **Peek overlay**: scrim fades in; card slides up 40px with the spring ease.

In React, prefer the **Motion** library (framer-motion) for the staggers and the
overlay, but plain CSS transitions are fine for hovers and drawers.

---

## 4. Components to Build (port from the mockup)

Build these as reusable components in `/components`:

| Component | Mockup source | Notes |
|-----------|---------------|-------|
| `Nav` | `<nav>` | Sticky, blurred paper bg, serif wordmark + hanger icon, pill links |
| `ClosetCard` | `.closet` module | THE feed unit. Props: profile + preview garments. Hover drop + lift. Click → opens `PeekOverlay`. Replaces the generic PostCard concept. |
| `PeekOverlay` | `.scrim` / `.peekcard` | Slide-up modal: owner header, 3 stat tiles, piece grid, follow button. |
| `DrawerSection` | `.drawer` | Collapsible drawer for My Closet, one per `WardrobeCategory`. |
| `WardrobeItemCard` | `.pitem` / `.pg` | Small piece card: swatch/photo, brand, name, cost-per-wear. |
| `StatCard` | `.statcard` | Serif number + label; `accent` variant is dark with rust number. |
| `GapCard` | `.gap` | AI gap-analysis insight card. |
| `Chip` | `.chip` | Filter pill, `on` state = ink fill. |

Garment/piece swatches in the mockup are CSS gradients so it works offline. In the real
app, swap them for actual images (`image_url` / `outfit_items`); keep a gradient
fallback for items with no photo.

---

## 5. Mapping to the schema

- `ClosetCard` ← a `profiles` row + a few `posts`/`wardrobe_items` for the preview rail.
  Use `style_personas[0]` as the persona pill, `posts_count` as the piece count.
- `PeekOverlay` ← that user's recent `posts` + public profile stats.
- `DrawerSection` ← `wardrobe_items` grouped by `category`.
- Cost-per-wear ← `purchase_price / NULLIF(times_worn,0)` (already a computed field in
  `types.ts` as `cost_per_wear`).
- `GapCard` ← the gap-analysis AI route (`GapAnalysisResult` in `types.ts`).

---

## 6. What NOT to do

- No hard/offset box-shadows (the brutalist look from earlier drafts). Use soft,
  realistic depth only: `0 14px 30px -20px rgba(36,31,26,.4)`.
- No bright primary colors, gradients-as-decoration, or neon. One rust accent only.
- No emoji in UI. The hanger logo is drawn with CSS borders.
- Don't use system fonts or Inter — only Fraunces + Hanken Grotesk.
- Keep Title Case out of headings — sentence case everywhere.
