# Spaced repetition — the "drill your mistakes" loop

This document is the **architecture layer** behind the drill feature: how a
question a student got wrong becomes a card that resurfaces on a schedule, and
how that schedule survives across devices. If you're touching `lib/reviews.ts`,
`lib/spaced-repetition.ts`, the `/api/reviews/*` routes, or the drill UI, read
this first.

---

## 1. What it does, in one line

When you miss a quiz question, it goes into a backlog and comes back to you on
an expanding schedule (today → 1 day → 3 days → ×ease …) until you reliably
know it — at which point it retires. This is the Anki/SuperMemo idea, trimmed
to a binary right/wrong grade and day-level granularity that fits exam-season
cramming.

---

## 2. The three layers

```
        pure algorithm                persistence                 surface
  ┌────────────────────────┐   ┌────────────────────────┐   ┌──────────────┐
  │ lib/spaced-repetition  │   │ local: lib/quiz-history │   │ QuizRunner   │
  │  - freshSrState        │◄──┤  (localStorage, anon +  │◄──┤ DrillRunner  │
  │  - scheduleNext        │   │   per-device, instant)  │   │ DrillClient  │
  │  - isDue / isGraduated │   ├────────────────────────┤   │ DrillCard    │
  │  - planReviewUpdate    │◄──┤ server: lib/reviews.ts  │◄──┤ /api/reviews │
  └────────────────────────┘   │  (Postgres, cross-      │   └──────────────┘
                               │   device, durable)      │
                               └────────────────────────┘
```

### 2a. Pure algorithm — `lib/spaced-repetition.ts`

No clocks, no I/O. `SrState = { ease, intervalDays, reps, dueAt(ms) }`. Pass
`now` in. Everything else is built on these:

- `scheduleNext(state, correct, now)` — advance after a grade. Correct grows
  the interval and nudges ease up; a miss is a *lapse* (reps reset, ease −0.2
  floored at 1.3, due now).
- `isGraduated(state, thresholdDays=21)` — interval ≥ threshold ⇒ mastered.
- `planReviewUpdate(state, correct, now, threshold)` — the decision the
  persistence layer needs: `{ retire, next }`. Extracted so the DB handler's
  update-vs-delete branch is unit-testable without a database.

Because this layer is pure, it carries the heaviest test load
(`tests/spaced-repetition.test.ts`).

### 2b. Persistence — two stores, dual-written

The same schedule lives in two places, and the runners **write to both**:

| | `localStorage` (`lib/quiz-history.ts`) | Postgres (`lib/reviews.ts`) |
|---|---|---|
| Scope | per-device | per-user, all devices |
| Covers | the anonymous demo quiz too | signed-in users only |
| Why | instant paint, offline, no-auth | durability + cross-device |

`WrongAnswer.sr?: SrState` carries the schedule locally; the `question_reviews`
table carries it on the server (one row per `(user, quiz, question)`, unique-
indexed, plus a `(user, dueAt)` index for the due-query).

**Local is the source of truth for a session in progress; the server is the
source of truth across devices.** They reconcile at the edges (see §3).

### 2c. Surfaces

- **QuizRunner** (`components/quiz-runner.tsx`) — on finish, records misses to
  localStorage *and* fire-and-forgets them to `POST /api/reviews`. Anonymous
  takers 401 harmlessly and keep the local path.
- **DrillRunner** (`components/drill-runner.tsx`) — each answer grades locally
  (`applyDrillResult`) *and* mirrors to `POST /api/reviews/grade`.
- **DrillClient** (`app/dashboard/drill/drill-client.tsx`) — paints the local
  drill instantly; if this device's local backlog is empty, pulls
  `GET /api/reviews/due` (fresh-device case).
- **DrillMistakesCard** (dashboard) — shows `max(serverCount, localCount)` due,
  so the nudge reflects cross-device truth.

---

## 3. Cross-device reconciliation — what's guaranteed, what isn't

**Guaranteed:**
- A signed-in user who misses questions on device A and opens the drill on a
  *fresh* device B (empty local) gets exactly A's due cards from the server.
- The dashboard due-count is cross-device (server-authoritative via `max`).
- Grades and misses always reach the server (best-effort POST; the row is the
  durable record).

**Not guaranteed (known limitation):**
- If device B *already has its own* local backlog, it drills from local and
  won't merge A's server-side updates until B's local empties. Real-time
  multi-device merge is intentionally out of scope for v1 — the dual-write +
  fetch-when-empty model gets the common cases right without the complexity
  (and risk) of a live sync that could wipe an in-progress local drill on a
  transient empty response.

---

## 4. Lifecycle of one card

1. **Miss it** in a quiz → `freshSrState` (due now) in both stores. A *repeat*
   miss of an already-tracked card is a lapse: snapshot refreshed, due now,
   reps reset (`recordMissedQuestions` upserts with `onConflictDoUpdate`).
2. **Drill it correct** → `scheduleNext` pushes it out (1d, 3d, then ×ease).
3. **Drill it wrong** → lapse back to due-now, ease drops.
4. **Recall it reliably** until interval ≥ 21 days → `planReviewUpdate` returns
   `retire: true`; the server **deletes** the row and the local store drops it.
   It's left your backlog for good.

The snapshot (prompt/options/answer/unit/explanation) is stored *with* the
card so a drill still works even if the original quiz is later deleted — the
`question_reviews.quizId` is deliberately **not** a foreign key for this reason.

---

## 5. Testing map

| Layer | File | What's pinned |
|---|---|---|
| Pure SM-2 | `tests/spaced-repetition.test.ts` | interval growth, lapse, graduation, `planReviewUpdate` branching |
| Local store | `tests/quiz-history.test.ts` | due filtering, drill build, weak-units |
| Input validation | `tests/reviews-input.test.ts` | Zod schemas + correctIndex-bounds sanitiser |
| HTTP contract | `tests/reviews-routes.test.ts` | 401 anon, 400 bad body, user-scoping |

The DB-touching functions in `lib/reviews.ts` (the actual SQL) are **not**
covered by these — they need a live Postgres. Smoke-test the upsert/lapse and
the graduation-delete paths against a real Neon branch before trusting a schema
change to that table.
