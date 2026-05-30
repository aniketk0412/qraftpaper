export default function DrillLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-[58px] border-b border-line bg-canvas/85" />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <div className="overflow-hidden rounded-2xl border border-line bg-tint/[0.02]">
          <div className="h-14 border-b border-line" />
          <div className="space-y-3 p-7">
            <div className="h-6 w-3/4 rounded bg-tint/[0.05]" />
            <div className="mt-5 space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl border border-line bg-tint/[0.02]"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
