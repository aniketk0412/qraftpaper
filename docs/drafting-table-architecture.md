# The Drafting Table — architecture outline

> Status: **proposal for review** (no implementation yet, per request).
> Goal: collapse the disjointed `Subjects` + `Blueprints` tabs into one
> unified, high-utility workspace — "The Drafting Table" — where a subject
> profile is a physical file and its exam blueprints expand contextually on
> the same canvas.

This document is the design + migration plan only. It deliberately contains
no application code. Once the open questions in §7 are decided, implementation
can proceed page-by-page.

---

## 1. Principles

1. **One canvas, two materials.** A generated paper is always `subject × blueprint` — content (the subject's syllabus/PYQ profile) crossed with structure (a blueprint's marks/sections/difficulty). The two are currently split across two tabs that the user must mentally re-join. The Drafting Table puts them on one surface.
2. **The subject is the primary object.** You start from "what am I studying?" (the file), then choose "in what shape?" (the blueprint). So subjects are the index; blueprints are the contextual expansion.
3. **Editorial/technical aesthetic, no regressions.** Reuse the established system — tokens only (`border-line`, `bg-canvas`, `bg-fg`/`text-canvas` ink buttons, indigo accent, exam-marker red), the `Panel` primitive, `.plate-grid`, serif headings, mono data labels. No `GlassCard`, gradients, glow, or pillow radii.

---

## 2. Current-state map (what exists today)

**Subjects** — `app/dashboard/subjects/page.tsx` (+ `[id]` detail, `/new`).
- DB-backed (`subjects`, `documents` tables). `DashboardSubject` carries `id, code, name, hasProfile, papers, quizzesTaken, masteryPct, examDate, daysToExam, accent`.
- A subject stores its syllabus / sample paper / PYQ documents and a compact reusable profile. `hasProfile` gates whether it can be generated from.

**Blueprints** — `app/dashboard/blueprints/page.tsx` → `components/dashboard/blueprints-manager.tsx`, model in `lib/blueprints.ts`.
- `Blueprint = { id, name, description, builtIn?, config: { examTitle, totalMarks, durationMins, sections: BlueprintSection[], difficultyMix } }`; `BlueprintSection = { title, instruction, marksPerQuestion, count }`.
- Two sources: `STARTER_BLUEPRINTS` (built-in, in code) and **custom blueprints stored in the browser via `localStorage`** (`loadCustomBlueprints` / `saveCustomBlueprint` / `deleteCustomBlueprint`). **Custom blueprints are NOT in the database today.**
- Blueprints are **global**, not tied to a subject. To use one you pick `blueprint + subject`, then `POST /api/generate/paper` with `{ subjectId, config: paperConfigFromBlueprint(bp, subjectName) }`.

**Generation config** — produced two ways:
- `components/dashboard/generation-panel.tsx`: a **hardcoded** default config (70 marks, 3 sections, 30/50/20 mix).
- `blueprints-manager.tsx`: `paperConfigFromBlueprint(bp, subjectName)`.

**Navigation** — `lib/dashboard-nav.ts`:
- `workspaceNav`: Overview `/dashboard`, Subjects `/dashboard/subjects`, Question Papers `/dashboard/papers`, **Blueprints `/dashboard/blueprints`**.
- `accountNav`: Billing `/billing`, Settings `/dashboard/settings`.

**Link surface to update (20 files)** reference `/dashboard/subjects` and/or `/dashboard/blueprints`: the nav + sidebar + topbar, `command-palette.tsx`, `exam-countdown.tsx`, `empty-state.tsx`, `subjects-section.tsx`, `notifications.tsx`, `generation-panel.tsx`, `app/manifest.ts`, the demo-quiz pages, `subjects/[id]`, `subjects/new`, and the dashboard/papers pages.

---

## 3. Proposed information architecture

**Replace two nav items with one.** `workspaceNav` becomes:
`Overview · The Drafting Table · Question Papers`.

- **Route:** keep `/dashboard/subjects` as the canonical Drafting Table URL (it already owns the most inbound links and the `[id]`/`new` children). Rename its nav label to **"The Drafting Table"** (icon: `DraftingCompass`/`Ruler`).
- **Retire `/dashboard/blueprints`** as a destination: turn `app/dashboard/blueprints/page.tsx` into a permanent redirect to `/dashboard/subjects` so existing deep links, the PWA manifest shortcut, and the command palette never 404. The blueprint *authoring* UI (create/edit) moves into the Drafting Table (see §4) or a focused `/dashboard/subjects/blueprints/new` modal route.
- **Command palette / notifications / manifest:** drop the standalone "Blueprints" entry; add "New blueprint" as an action inside the Drafting Table.

This is the single highest-touch change (nav + ~20 link sites) and should be its own phase (see §6) so it can be reviewed in isolation.

---

## 4. The workspace view — interaction model

The Drafting Table is one vertical **ledger of subject files**. Each row is a
collapsed file; clicking it expands a **contextual blueprint sheet** beneath it
on the same canvas (an accordion expansion, not a navigation).

```
THE DRAFTING TABLE                                   [ + NEW SUBJECT ]
─────────────────────────────────────────────────────────────────────
[ 01 ]  CS-204   Data Structures & Algorithms        03 docs · READY   ▸
─────────────────────────────────────────────────────────────────────
[ 02 ]  MA-201   Linear Algebra                       02 docs · READY   ▾
        ┌───────────────────────────────────────────────────────────┐
        │  SPECIFICATION MATRIX — choose a structure to draft         │
        │  ┌──────────────┬───────────────────────────┬───────────┐  │
        │  │ End-Semester │ [ 180 MIN // 3 SECTIONS ]  │ 70 marks  │  │
        │  │ Examination  │ [ EASY 30 / MED 50 / HARD ]│ [ DRAFT ▸]│  │
        │  ├──────────────┼───────────────────────────┼───────────┤  │
        │  │ Unit Quiz    │ [ 20 MIN // 1 SECTION ]    │ 20 marks  │  │
        │  │              │ [ MCQ // 10 QUESTIONS ]    │ [ DRAFT ▸]│  │
        │  └──────────────┴───────────────────────────┴───────────┘  │
        │  + DEFINE CUSTOM BLUEPRINT                                   │
        └───────────────────────────────────────────────────────────┘
─────────────────────────────────────────────────────────────────────
[ 03 ]  PH-110   Engineering Physics                  NEEDS DOCS        ▸
```

- **Collapsed row** = the existing Archivist-Ledger subject entry: `[NN]` index, code (mono indigo), name (serif), inline stats, status stamp. A `▸/▾` disclosure on the right.
- **Expanded sheet** = the **Specification Matrix** (§5): the subject's runnable blueprints rendered as an engineering schema table, each row = one blueprint with a `DRAFT` action that generates `this subject × this blueprint` (the existing `POST /api/generate/paper` call, unchanged).
- Only one subject expands at a time (keeps the canvas calm). Expansion state is client-side; deep-linkable via `?open=<subjectId>` is a nice-to-have.
- A `NEEDS DOCS` subject expands to a "upload syllabus/PYQ to unlock blueprints" prompt instead of the matrix.

This directly delivers the requested behavior: "clicking a subject folder reveals the blueprint configuration options as a direct contextual expansion sheet right on the same workspace canvas."

---

## 5. Component overhaul — the Specification Matrix

Replaces the three rounded white blueprint cards. It is a **schema table**, not a card array.

- **Container:** a `.plate-grid` / `border-y border-line` framed table — razor-thin ruled dividers (`border-line`), flat `bg-canvas`, square corners, zero shadow. Columns read like a drawing titleblock: `NAME · CONSTRAINTS · WEIGHT · ACTION`.
- **Blueprint name:** commanding **serif** (`font-serif`, e.g. "End-Semester Examination").
- **Constraints:** rigid uppercase **mono** chips — `[ DURATION: 180 MIN // STRUCTURE: 3 SECTIONS ]`, `[ EASY 30 / MED 50 / HARD 20 ]`. Derived from `blueprint.config` (`durationMins`, `sections.length`, `difficultyMix`, `sectionsTotalMarks`).
- **Weight:** the total-marks figure in big mono tabular numerals (the metric-cell language from the dashboard).
- **Action:** the **ink "execute" block** — `GlowButton variant="ink"` (matte near-black, 1px ink border, hard offset shadow, `active:translate` push-down). Label `Draft paper ▸`. This replaces both the teal capsule and the ambiguous "Add a profiled subject to use" link (which disappears entirely — the matrix only renders for `READY` subjects).
- **Built-in vs custom:** a small mono marker (`[ STARTER ]` / `[ CUSTOM ]`) instead of the pill badge. Custom blueprints keep their delete affordance as a quiet icon button.
- **Define custom blueprint:** a single `+ DEFINE CUSTOM BLUEPRINT` row opens the existing `CreateBlueprintForm` (restyled to the ledger-form input language from the settings rewrite — underline fields, mono `[ REF // … ]` labels).

---

## 6. Migration / rollout plan (phased, each independently reviewable)

1. **Foundation move (no UX change yet):** lift the `BlueprintsManager` + `CreateBlueprintForm` into shared components callable from the Drafting Table; restyle them to the editorial system (they currently use `GlassCard`, `IconTile`, `rounded-full`, `bg-tint`, indigo focus rings).
2. **Nav + routing consolidation:** merge nav to "The Drafting Table"; redirect `/dashboard/blueprints` → `/dashboard/subjects`; update the ~20 link sites + manifest + command palette. Ship behind nothing — it's purely structural.
3. **Contextual expansion:** add the per-subject accordion + Specification Matrix to the subjects ledger. This is the centerpiece.
4. **Decommission:** delete the old blueprints page body (the redirect stub remains), remove dead links, update docs.

Each phase is a separate PR/commit so regressions are bisectable.

---

## 7. Open questions (need your decision before build)

1. **Blueprint persistence.** Custom blueprints live in **browser `localStorage`** today — they vanish on another device and aren't tied to the account. Consolidating into a per-account workspace is the natural moment to move them to a DB table (`blueprints`, FK → user). Do you want that migration now, or keep them local for v1 of the Drafting Table?
2. **Blueprint scope.** Stay **global** (one library, runnable against any subject — matches today and the matrix model) or make blueprints **per-subject**? Global is simpler and more reusable; per-subject is more "this file's exam shapes." Recommend global, surfaced contextually.
3. **`GenerationPanel` on Overview.** It currently hardcodes a 70-mark config. Should it become "pick a subject + blueprint" too (sharing the matrix), or stay a quick-draft shortcut? Recommend it becomes a thin shortcut that deep-links into the Drafting Table with a subject pre-expanded.
4. **Route/label.** Keep the canonical URL `/dashboard/subjects` (lowest-risk, most inbound links) with the label "The Drafting Table", or introduce `/dashboard/table` with redirects from both old routes? Recommend keeping `/dashboard/subjects`.
5. **Off-black action language.** The new `ink` GlowButton variant (matte near-black, theme-safe) is the proposed "Draft/Execute" button across the workspace. Confirm it should be the standard for in-app primary actions (indigo staying for marketing/landing).

---

## 8. What this is NOT

- Not a change to the generation API or the `subject × blueprint → paper` model — only the surface that composes them.
- Not a change to Question Papers (the output registry stays its own page).
- Not started — awaiting answers to §7.
