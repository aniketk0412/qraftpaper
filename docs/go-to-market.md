# Go-to-market — the honest version

This is a working strategy doc, not a pitch. It's written to be useful, which
means it leads with the parts that are uncomfortable. Pair it with
`docs/analytics.md` — GTM without the funnel is guessing.

---

## 1. The competitive reality (don't skip this)

A scan of the Indian student AI-study market in 2025–26 turns up three facts
that directly threaten QraftPaper's current shape:

1. **Google NotebookLM is free and does your core loop.** Upload your
   syllabus + PYQ PDFs, get summaries, Q&A, study guides, even audio
   overviews. It's from Google, it's free, and a student already trusts it.
   Your "upload PDF → get study material" pitch competes with this directly.

2. **Generic AI is effectively free for your exact users *right now*.**
   ChatGPT Go (₹399/mo) is free for 12 months for all Indian users through
   Dec 2026; Gemini Pro is free for a year for verified students. So the
   "cheaper than a generic $20 AI sub" comparison on your pricing page is
   **factually wrong for your market today** — their generic AI costs ₹0.

3. **The cheap incumbents are cheaper than you and content-rich.** Testbook
   is ₹299/mo with thousands of real mock tests; PadhAI ₹59/day; PhysicsWallah
   free–₹6k/yr; SATHEE (IIT Kanpur) is free. You're ₹579/mo with zero
   pre-built content — every paper is generated on demand.

**Conclusion:** QraftPaper cannot win as "AI study tool for students" in
general. That field is taken, free, and better-funded. It can only win in a
gap the big players structurally ignore.

Sources at the bottom.

---

## 2. The actual wedge — university *semester* exams

Here's the gap. PhysicsWallah, Doubtnut, Testbook, SATHEE all serve
**standardised national exams** — JEE, NEET, SSC, UPSC. Millions of students,
one syllabus, so it's worth building a huge content library.

**Nobody serves the long tail of university semester exams.** A 4th-semester
B.Tech student at Parul University studying "Microprocessors" has:

- No PhysicsWallah batch for their exact course.
- A syllabus PDF and last year's question paper from a senior.
- An exam in two weeks, in their university's *specific* paper format.

NotebookLM gives them generic summaries. ChatGPT gives them generic questions.
**Neither produces a mock paper in their university's exact section/marks
structure** — because that pattern only matters to a few hundred students, so
nobody bothered. That's your wedge:

> **"Mock papers in YOUR university's exact exam format, from your own
> syllabus and PYQs — for the semester exams the big apps don't cover."**

This is narrow on purpose. Narrow is how a zero-user product gets its first
hundred. Do NOT position against JEE/NEET — you will lose.

---

## 3. The pricing reckoning

₹579/mo (or even $7) is very hard to defend when:
- NotebookLM and student ChatGPT/Gemini are free,
- Testbook is ₹299 with real content,
- and you have no track record.

A monthly subscription is also the wrong *shape*: semester-exam prep is bursty.
A student needs you for ~2 weeks, twice a year. They will not hold a monthly
sub for a need that's dormant 10 months a year — they'll subscribe, use it,
and churn, and feel ripped off.

Three options, roughly in order of likely fit:

1. **Free tier + paid power tier.** Give 2–3 generations/month free (enough to
   feel the value and prep one subject), charge for volume. This is the only
   way to beat "free NotebookLM" — you have to *also* be free at the entry,
   then win on the paper-format quality. This contradicts the current
   "no free tier" stance, but the current stance was set before this market
   scan.

2. **Per-exam-season pass.** ₹99–₹149 for one exam window (2–4 weeks,
   unlimited generation). Matches the bursty need, removes the "why am I
   paying in the off-season" churn, and is an easy yes vs a recurring
   commitment. Probably the best fit for the actual usage pattern.

3. **Keep the monthly sub** only if testing proves students will pay it. The
   funnel (`subscription_activated` vs `subject_created`) will tell you fast.

Either way: **the unit economics already conflict with engagement** (every
streak/drill nudge that drives more generation cuts the margin — see the
harsh-reality note). A free-entry + per-season model resolves that better than
a flat monthly cap people rarely fill.

---

## 4. Get your first 10 testers (this week, not after more features)

The product is built. The only thing missing is a single real user. Plan:

1. **Pick ONE college and ONE upcoming exam window.** Ideally your own / a
   friend's. You need density, not spread — 10 students in one WhatsApp group
   beats 1 student in 10 colleges.

2. **Go where they already are, 2 weeks before their exams:**
   - Course/section WhatsApp groups (the highest-intent channel in India).
   - College subreddits and r/Indian_Academia, r/[yourcollege].
   - The class CR (class representative) — one message to them can reach 60
     students.

3. **The offer:** *"I built a tool that turns your syllabus + last year's
   paper into mock papers in our exam format. Free for this exam season — I
   just want 10 people to try it and tell me if it's useful. DM me."* Free,
   specific, low-commitment, time-bound.

4. **Manually onboard each one.** Get on a call, watch them upload their first
   PDF, watch where they get confused. This is where you'll learn whether the
   signup→subject_created→generated funnel actually converts — the same drop-
   offs your PostHog funnel will later show at scale, but with the *reasons*
   attached.

5. **The one question that matters:** after they've used a generated paper,
   ask *"would you have paid ₹100 for this before your exam?"* Their face when
   they answer is your real pricing research.

Target: 10 students, 1 exam window, watch the funnel, ask the price question.
That's the entire job right now.

---

## 5. Cold-outreach / launch copy (ready to send)

**WhatsApp / DM (to a class group or CR):**

> Hey — I made a small tool for our semester exams. You upload the syllabus +
> last year's paper, and it generates full mock papers in our exact exam
> format (sections, marks, the works) plus timed MCQ quizzes. I'm giving it
> free for this exam season because I want a few people to try it and tell me
> what's broken. Want the link? No signup hassle, takes 2 min.

**r/Indian_Academia / college subreddit post:**

> **Title:** Made a free tool that turns your syllabus + PYQs into mock papers
> in your college's exam format (giving it free this exam season)
>
> For semester exams there's no PhysicsWallah — you just have the syllabus and
> a senior's old paper. So I built something that takes those and generates
> full mock papers matching your paper's structure (sections, marks per Q,
> difficulty) and timed MCQ quizzes you can share with your group.
>
> It's free for this exam season. I genuinely just want feedback on whether
> it's useful before exams. Link in comments. Roast it.

Keep both honest and un-salesy. For the first 10, *credibility beats
conversion-optimisation* — you're recruiting collaborators, not closing sales.

---

## 6. What success looks like in 30 days

Not revenue. **Evidence.** Specifically:
- 10+ students created a subject (`subject_created` fired).
- 70%+ of those generated at least one paper or quiz.
- 3+ said, unprompted, that they'd use it again next exam.
- At least one answer to "would you pay ₹100" that wasn't a polite no.

If you get that, you have a wedge worth widening. If you don't, the
free-NotebookLM problem is real and the product needs a sharper reason to
exist — which is far better to learn from 10 students this month than from a
failed launch later.

---

### Sources

- [Best AI tools for students in India 2026 — ReviewMyTools](https://www.reviewmytools.com/best-ai-tools-students-india/)
- [Best AI study apps for exam preparation 2026 — DigitalWala](https://digitalwala.live/best-ai-study-apps-for-exam-preparation-in-2026/)
- [QuestionPaper.ai](https://questionpaper.ai/) and [Eklavvya AI Question Paper Generator](https://www.eklavvya.com/blog/ai-question-paper-generator/) (the institutional incumbents)
- [PadhAI.ai](https://padhai.ai/) (₹59/day UPSC), [Testbook](https://testbook.com) (₹299/mo)
