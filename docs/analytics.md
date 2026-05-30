# Analytics & the activation funnel

This is the deliberate event taxonomy for QraftPaper and how to read it in
PostHog. For a product still looking for product-market fit, **this file is
how you learn anything** — without it you have a pile of events that don't
answer a question.

The canonical event list lives in code as the `AnalyticsEvent` union in
`lib/analytics.ts`. It's a **closed type** — a typo can't create a phantom
event that silently splits a funnel, and adding an event means adding it to
the union first (the compiler then shows you every call site). Keep this doc
and that union in lockstep.

---

## The funnel (in order)

```
  signup_completed          a real account exists
        │
        ▼
  subject_created           ACTIVATION — they uploaded their own material
        │                   (this is the number that matters most)
        ▼
  paper_generated  /        CORE VALUE — they produced something from their
  quiz_generated            own syllabus
        │
        ▼
  quiz_completed            FELT THE VALUE — took a quiz end to end
        │
        ▼
  subscription_activated    MONETIZED
```

The two transitions to obsess over while pre-PMF:

1. **signup → subject_created.** If people sign up and never create a
   subject, your onboarding is the problem, not the product. This is the
   classic activation cliff.
2. **subject_created → paper_generated / quiz_generated.** If they make a
   subject but never generate, the generation step is too confusing, too
   slow, or they hit the paywall before feeling any value.

If those two convert, you have something. If they don't, no amount of
feature work downstream matters.

---

## Every event

| Event | Fired from | Key properties | Funnel stage |
| --- | --- | --- | --- |
| `signup_completed` | `app/(auth)/actions.ts` | — | Acquisition |
| `subject_created` | `POST /api/subjects` | `code` | **Activation** |
| `paper_generated` | `POST /api/generate/paper` | `plan`, `subjectId`, `totalMarks` | Core value |
| `quiz_generated` | `POST /api/generate/quiz` | `plan`, `subjectId`, `questionCount` | Core value |
| `quiz_completed` | `POST /api/quiz/[id]/complete` | `score`, `total`, `pct`, `durationSeconds` | Value felt |
| `subscription_activated` | billing webhook | `plan`, `status` | Monetization |
| `subscription_cancelled` | billing webhook | `plan`, `status` | Churn |
| `paper_reconciled` | `POST /api/generate/paper` | `requestedMarks`, `actualMarks`, `marksDelta`, `renumbered` | Internal health |
| `quiz_reconciled` | `POST /api/generate/quiz` | `generated`, `kept`, `dropped`, `optionsDeduped`, `trimmed` | Internal health |

`*_reconciled` are **not funnel events** — they're a health signal on raw AI
output quality. Watch them as a trend: a rising `marksDelta` or `dropped`
count means the model is drifting from the blueprint and it's time to tune
the prompt or bump the model. They're the input to a future "regenerate if
quality < X" guard.

---

## Build these in PostHog (10 minutes)

1. **Activation funnel** — Insights → Funnel, steps:
   `signup_completed → subject_created → (paper_generated OR quiz_generated)
   → quiz_completed → subscription_activated`. Set the window to 7 days.
   This single chart tells you where users fall off.

2. **Activation rate** — Trends, `subject_created` ÷ `signup_completed`,
   weekly. Your north-star input number pre-PMF. Target: get it climbing.

3. **Time-to-value** — Funnel → "time to convert" between
   `subject_created` and the first generation. If it's hours/days, the gap
   between making a subject and generating is too wide.

4. **Generation health** — Trends on `paper_reconciled.marksDelta` (avg) and
   `quiz_reconciled.dropped` (sum). Flat-near-zero = the model is following
   the blueprint. Rising = investigate.

5. **Retention** — Retention insight keyed on any of `paper_generated`,
   `quiz_generated`, `quiz_completed`. D1/D7/D30. For exam prep, expect
   bursty (spikes before exam seasons), so read it against the academic
   calendar, not as a flat SaaS curve.

---

## Honest caveats

- **`quiz_completed` is signed-in only.** Anonymous shared-link takers have
  no stable `distinctId`, so they're excluded from the funnel by design.
  They're a *distribution* signal (track separately if you want the viral
  loop), not an activation one.
- **No client-side event taxonomy yet.** Pageviews come from
  `components/providers/posthog-provider.tsx` (PostHog autocapture). If you
  want funnel steps like "viewed pricing → clicked subscribe," add explicit
  client events with the same naming discipline.
- **Identity:** server events use the user's uuid as `distinctId`. Make sure
  the client provider identifies the user with the same uuid after login, or
  pre-login pageviews won't stitch to post-login events.
