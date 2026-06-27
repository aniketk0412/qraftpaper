// The quiz preview loads the quiz record + attempt stats behind auth. Mirror
// the sticky header + centered question card (with options) so the page never
// flashes a bare spinner — matches the dashboard skeleton language.
export default function QuizLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-tint/[0.05]" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 max-w-[44vw] rounded bg-tint/[0.05]" />
              <div className="h-3 w-24 rounded bg-tint/[0.03]" />
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <div className="h-9 w-24 rounded-full bg-tint/[0.04]" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-tint/[0.05]" />

        {/* Question card */}
        <div className="mt-8 rounded-2xl border border-line bg-tint/[0.02] p-6 sm:p-7">
          <div className="h-3 w-24 rounded bg-tint/[0.03]" />
          <div className="mt-4 h-5 w-3/4 rounded bg-tint/[0.05]" />
          <div className="mt-6 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl border border-line bg-tint/[0.015]"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
