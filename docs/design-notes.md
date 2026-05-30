# Design notes — QraftPaper

This document is the **rationale layer** behind the visual decisions in
`app/globals.css`, `components/logo.tsx`, and the landing/dashboard surfaces.
If you're tweaking the brand, read this before reaching for tokens.

---

## 1. Who this is for

College students, mostly in India, prepping for end-of-semester exams. They
are:

- **Time-poor.** Cram windows are 1–7 days. The UI has to feel decisive,
  not deliberative.
- **Habit-driven.** Streaks, milestones and "I showed up today" matter more
  than content polish. Duolingo, not Notion.
- **Group-aware.** Shared quiz links travel through WhatsApp. The OG image
  is part of the product.

Mental model: **Duolingo's emotional engine, Linear's information density.**
Not Quizlet's playfulness, not Khan Academy's institutional grey.

---

## 2. Palette — two-hue accent system

`globals.css` ships **two hues, not one**:

| Token family | Hue | Used for | Examples |
| --- | --- | --- | --- |
| `violet-*` (named for token stability — actually teal) | Cool | Navigation, links, primary surface, calm progress | Sidebar active state, link hover, generation card glow |
| `gold-*` | Warm amber | Streak, milestone, exam-urgent, earned badge | Topbar flame chip, exam-≤4d banner, weekly-goal "Hit" pill |

For a long stretch `--color-gold` was collapsed to the same hex as
`--color-violet-bright`, so every "fire" surface in the app silently
rendered as teal. **Never recombine them.** A study app without a warm
accent is a finance dashboard with a checklist on it.

### Contrast budget

- Light canvas: `#e8ecf0` cream-blue. Gold-700 (`#b45309`) lands at ~4.2:1
  — clears WCAG AA for large text (18pt+ / 14pt bold). Since 100% of
  in-app gold copy is large numerics or bold banner headlines, this is fine.
- Dark canvas: `#0e1620` deep navy. Gold-500 (`#f59e0b`) lands at ~10:1.

If you need small gold body text, use `--color-gold-deep` (`#92400e` in
light, `#d97706` in dark) and re-check.

### When to use which

- **Default to violet** for any neutral, ongoing-action surface (CTAs,
  links, sidebar, progress).
- **Reach for gold** only when the user just earned something, when a
  deadline is real, or when you want to signal "this is the one thing
  that matters right now." If gold is on more than one surface in the
  viewport, you've lost.

---

## 3. Logo — the Q mark

Geometry lives in `components/logo.tsx`, `app/icon.svg`, and
`app/apple-icon.tsx`. **They must stay in sync.**

```
Ring:  cx=10.8  cy=11  r=7  stroke=2.8
Tail:  from (14.8, 15.2) to (19.2, 19.6)  stroke=3.4  linecap=round
```

### Design intent

The previous mark had ~65% of the tail INSIDE the ring with only a
4-unit stub poking out. At favicon size this reads as "circle with a
notch," not "Q." Serif Q's solve this by having the tail predominantly
OUTSIDE the ring — the new geometry mirrors that, with ~6.2 of the
tail's units past the ring's perimeter.

### Two-tone

Ring uses `currentColor` so it inherits whatever surface it's on; tail
uses a hard-coded `#5fb3b3` teal so the mark stays two-tone even on
colourful backgrounds (favicon, PWA icon, dropped into a Notion page).

### Wordmark

The wordmark beside the mark keeps **"QraftPaper" intact**. We don't
drop the leading Q to merge with the mark — that trick only works when
the mark is a type-matched glyph (Stripe), and ours is iconic. "Paper"
is muted half a stop so the brand reads as "Qraft + product type"
which matches how students actually refer to the tool.

---

## 4. Typography

- **Body:** Inter, the closest free Google Font to Söhne/GT America used
  by every modern SaaS landing page. Don't replace it without testing
  numerals — Inter's tabular figures are unusually well-balanced for a
  free face.
- **Mono:** JetBrains Mono. Used only for `font-mono` micro-labels
  (eyebrows, badges, stat captions).
- **Display:** `text-display` and `text-display-xl` utilities in
  `globals.css`. Bundle four things any big numeric needs:
  - `clamp()` font size for fluid scaling
  - `letter-spacing: -0.04em` so digits hold tight together
  - `tabular-nums` so "9" → "100" doesn't shift layout
  - explicit `font-weight: 600`

Use `text-display-xl` for hero-scale single-message numerals (the $7
on the billing card). Use `text-display` for finished-state moments
(the score on a completed quiz). For stat tiles inside a grid, stay at
`text-3xl` but add `tabular-nums` + `tracking-[-0.03em]` inline — the
clamp() ramp on the display utility is too eager for tile constraints.

---

## 5. Glass surface treatment

`@utility glass` and `@utility glass-strong` in `globals.css`. Both
combine a 1px line, a soft top-edge highlight, and a backdrop blur.

### When glass works

- **Translucent overlay surfaces** that need to feel attached to the
  page but not heavy: command palette, notifications dropdown, user
  menu, the pricing card on billing.
- **The dashboard sidebar** in standalone mode — the blur reads as
  depth instead of as a heavy panel.

### When glass fails

- **Dense content cards** on the cream canvas. The backdrop-blur has
  nothing to blur into; the card just reads as a tinted rectangle.
  Prefer `border border-line bg-tint/[0.02]` for those.
- **Anything that needs to be scannable at a glance** — the noise glass
  introduces costs you eye-tracking time. Use solid surfaces for tables,
  long lists, and editor canvases.

If you're reaching for `glass-strong` for the third surface in a single
viewport, you've overused the treatment. Promote one to `solid`.

---

## 6. Motion

Lives in `lib/motion.ts` and is used via `Reveal` + the per-component
`motion.div` calls. The pattern:

- **fadeUp** is the universal entry — 14px translate, 0.6–0.7s duration,
  `easeOut`.
- **staggerParent** orchestrates the hero word-by-word reveal. Don't
  copy this anywhere else; it's signature.
- **AnimatePresence** wraps modal/dropdown enters and exits with the
  same 0.18–0.22s timings.
- `prefers-reduced-motion: reduce` shuts off all `animation` and
  `transition` at the CSS level via `app/globals.css`. Don't write
  per-component reduce-motion logic — it's covered.

---

## 7. Spacing rhythm

Tailwind's default scale is the floor; the section rhythm in the app uses
a tighter set:

- Inside a card: `gap-1.5 / gap-2.5 / gap-4`
- Between siblings in a column: `mt-3 / mt-5 / mt-7`
- Between sections: `mt-10 / mt-14 / mt-16`
- Hero block padding: `section-pad` utility (`clamp(5rem, 11vw, 9rem)`)

If you're reaching for `mt-9` or `mt-13`, snap to the nearest standard
value. The rhythm only works if it's consistent.

---

## 8. Things to never do

- **Add a third accent hue.** Two is the point. A third makes nothing
  feel important.
- **Replace gold with another warm.** Amber-700 specifically clears AA
  on the cream canvas. Red, orange, coral all need re-validation and
  also break habit-app convention.
- **Set the mark on a light background without the dark container.**
  The ring loses contrast immediately. If you need a light-surface
  variant, redraw the ring at `--color-fg` with the tail unchanged.
- **Add per-page colour overrides.** The token system is the source of
  truth. If a surface needs to feel "more urgent," reach for gold; if
  it needs to feel "more calm," reach for violet. There is no third
  option.

---

## 9. What to ship next, in order

If you have one more pass to make:

1. **Per-unit mastery breakdown** — quiz attempts currently store
   aggregate score/total only. Capture per-question outcomes so the
   subject card can say "weak on Unit 3, solid on Units 1–2."
2. **Spaced-repetition surface** — once per-unit data exists, surface
   "practise these 5 questions you've gotten wrong" as the daily
   default action. This is the single biggest engagement multiplier
   left untapped.
3. **Social proof** — at >100 users the billing-hero counter ("X+
   students practising") flips on automatically. Keep it honest; never
   pad the number.
