const sections = [
  {
    title: "Section A — Short Answer",
    rubric: "Answer all questions.",
    weight: "5 × 2 = 10",
    questions: [
      {
        n: 1,
        unit: "I",
        marks: 2,
        text: "Define an abstract data type and give one example distinct from a primitive type.",
      },
      {
        n: 2,
        unit: "II",
        marks: 2,
        text: "State the average-case cost of a hash-table lookup and the assumption it rests on.",
      },
    ],
  },
  {
    title: "Section B — Descriptive",
    rubric: "Answer any three.",
    weight: "3 × 10 = 30",
    questions: [
      {
        n: 3,
        unit: "III",
        marks: 10,
        text: "Construct an AVL tree for the keys 30, 20, 40, 10, 25 and show each rebalancing rotation.",
      },
      {
        n: 4,
        unit: "IV",
        marks: 10,
        text: "Compare separate chaining and open addressing as collision-resolution strategies.",
      },
    ],
  },
];

/**
 * The hero's credibility anchor: a generated question paper rendered as an
 * authentic physical sheet. Uses the always-paper palette (never theme-aware —
 * a sheet of paper is a sheet of paper) with a thin ink border, square corners
 * and a hard 6px offset shadow so it sits on the page like a real printout —
 * no glass, no blur, no glow.
 */
export function HeroVisual() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="border border-paper-ink bg-paper text-paper-ink shadow-[6px_6px_0_0_var(--color-paper-ink)]">
        {/* Perforated tear-away header. */}
        <div className="border-b border-dashed border-paper-line py-1.5 text-center">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.32em] text-paper-faint">
            Detach · answer in the booklet provided
          </span>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center justify-between font-mono text-[0.56rem] uppercase tracking-[0.24em] text-paper-muted">
            <span>B.Tech · Sem IV</span>
            <span>CS-204</span>
          </div>
          <h3 className="mt-3 text-center font-serif text-[1.35rem] font-medium leading-tight tracking-tight">
            Data Structures &amp; Algorithms
          </h3>
          <p className="mt-1 text-center font-mono text-[0.56rem] uppercase tracking-[0.26em] text-paper-muted">
            End-Semester Examination
          </p>
          <div className="mt-4 flex items-center justify-between border-y border-paper-line py-2 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-paper-strong">
            <span>Time — 3 Hours</span>
            <span>Max. Marks — 70</span>
          </div>
          <div className="flex items-center justify-between py-2 font-mono text-[0.54rem] uppercase tracking-[0.18em] text-paper-muted">
            <span>Roll No.</span>
            <span className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-3 w-2.5 border border-paper-line" />
              ))}
            </span>
          </div>
        </div>

        <div className="px-6 pb-3">
          {sections.map((s) => (
            <div key={s.title} className="mt-3">
              <div className="flex items-baseline justify-between border-b border-paper-ink pb-1">
                <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.16em]">
                  {s.title}
                </span>
                <span className="font-mono text-[0.56rem] text-paper-muted">
                  [ {s.weight} ]
                </span>
              </div>
              <p className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.18em] text-paper-faint">
                {s.rubric}
              </p>
              <ol className="mt-2 flex flex-col gap-2.5">
                {s.questions.map((q) => (
                  <li key={q.n} className="flex gap-2.5">
                    <span className="font-mono text-[0.72rem] leading-tight text-paper-strong">
                      {q.n}.
                    </span>
                    <span className="flex-1 text-[0.78rem] leading-snug">
                      {q.text}
                    </span>
                    <span className="shrink-0 text-right leading-tight">
                      <span className="font-mono text-[0.62rem] text-paper-strong">
                        ({q.marks})
                      </span>
                      <span className="mt-0.5 block font-mono text-[0.46rem] uppercase tracking-[0.12em] text-paper-faint">
                        Unit {q.unit}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-paper-line py-1.5 text-center">
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.3em] text-paper-faint">
            — End of Question Paper —
          </span>
        </div>
      </div>
    </div>
  );
}
