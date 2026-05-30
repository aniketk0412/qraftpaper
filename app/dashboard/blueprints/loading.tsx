export default function BlueprintsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-tint/[0.04]" />
      <div className="mt-4">
        <div className="h-4 w-28 rounded bg-tint/[0.04]" />
        <div className="mt-2 h-9 w-80 max-w-full rounded-2xl bg-tint/[0.05]" />
        <div className="mt-2 h-4 w-2/3 max-w-xl rounded bg-tint/[0.03]" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-line bg-tint/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
