// The paper editor loads a record + normalizes its config behind auth. Mirror
// the sticky header + centered document so the viewer never flashes a bare
// spinner — matches the skeleton language used across the dashboard.
export default function PaperLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-tint/[0.05]" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-44 max-w-[44vw] rounded bg-tint/[0.05]" />
              <div className="h-3 w-28 rounded bg-tint/[0.03]" />
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <div className="h-9 w-24 rounded-full bg-tint/[0.04]" />
            <div className="h-9 w-28 rounded-full bg-tint/[0.05]" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <div className="rounded-2xl border border-line bg-tint/[0.02] p-8 sm:p-10">
          {/* Paper title block */}
          <div className="mx-auto h-6 w-2/3 rounded bg-tint/[0.05]" />
          <div className="mx-auto mt-3 h-3 w-1/3 rounded bg-tint/[0.03]" />

          {/* Question rows */}
          <div className="mt-9 flex flex-col gap-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-2.5">
                <div className="h-4 w-3/4 rounded bg-tint/[0.04]" />
                <div className="h-3 w-1/2 rounded bg-tint/[0.03]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
