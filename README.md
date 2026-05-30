# QraftPaper

AI exam-prep for college students. Upload your syllabus and last year's
question paper, get mock papers and timed MCQ quizzes in your own paper
format. [Read the about page →](app/about/page.tsx)

Built on Next.js 16 (App Router) + Drizzle + Neon Postgres + NextAuth +
Lemon Squeezy. Generation runs on Claude Haiku via OpenRouter.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npm run db:migrate
npm run dev
```

Full provisioning (Neon, Resend, OpenRouter, Lemon Squeezy, Turnstile,
PostHog) lives in [`SETUP.md`](SETUP.md). Don't skip it — most env
vars are required, not optional.

## Scripts you'll actually use

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server. |
| `npm run check` | typecheck + lint + test. Run this before pushing. |
| `npm run typecheck` | `tsc --noEmit`. Wraps the most common debug command. |
| `npm run test` | Vitest unit tests (8 files, 57+ cases). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:e2e` | Playwright smoke tests. |
| `npm run analyze` | Bundle treemap. Run before adding heavy deps. |
| `npm run db:generate` | drizzle-kit migration from schema diff. |
| `npm run db:migrate` | Apply pending migrations to `$DATABASE_URL`. |
| `npm run db:studio` | drizzle-kit's visual DB browser. |

## Repo layout

```
app/
  (auth)/          login, signup, forgot-password, reset-password
  api/             route handlers — most use lib/api-responses helpers
  billing/         pricing page + LemonSqueezy checkout entry
  dashboard/       authenticated app (overview, subjects, papers, blueprints, settings)
  papers/[id]/     paper editor (auth-gated)
  quiz/[id]/       quiz runner (auth-gated)
  take/[id]/       PUBLIC shared-quiz endpoint
  demo/quiz/       sample MCQ — no signup, used as conversion hook

components/
  dashboard/       app-only chrome (sidebar, topbar, weekly-goal, streak-milestone, ...)
  landing/         marketing surfaces (hero, features, pricing, faq)
  providers/       SmoothScroll, PostHogProvider
  ui/              primitives (GlowButton, GlassCard, IconTile, Reveal)

lib/
  ai/              generate.ts (paper/quiz), extract.ts (PDF → text), safety.ts
  api-responses.ts unauthorized()/badRequest()/parseJson() helpers
  db/              drizzle schema + connection
  streaks.ts       habit engine (current + weekly + milestones)
  plans.ts         single source of truth for pricing AND server-side limits
  subjects.ts      cached server-side subject listing with mastery aggregation

drizzle/           migrations (drizzle-kit generated)
docs/
  design-notes.md  WHY the visual decisions are what they are
SETUP.md           production env + provider provisioning
tests/             vitest specs
```

## Design notes

The brand foundation lives in [`docs/design-notes.md`](docs/design-notes.md).
Read it before touching `app/globals.css`, the logo files, or any
visual primitive. Tokens, contrast budget, when-glass-works, spacing
rhythm, and a "never do this" list to head off regressions.

## Contributing

1. Fork or branch off `master`.
2. `npm run check` must pass before you open a PR.
3. CI (`.github/workflows/ci.yml`) runs the same three steps —
   `npm run typecheck`, `npm run lint`, `npm run test`.
4. Commit messages prefer "Imperative subject — one-line rationale,"
   matching the existing `git log --oneline`.

## License

Private — not currently open source.
