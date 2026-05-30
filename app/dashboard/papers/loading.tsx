// Paginated DB query + count; skeleton list rows + the search bar so the
// page never goes blank under flaky network.
export default function PapersLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-tint/[0.04]" />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-4 w-40 rounded bg-tint/[0.04]" />
          <div className="mt-2 h-9 w-72 max-w-full rounded-2xl bg-tint/[0.05]" />
          <div className="mt-2 h-4 w-80 max-w-full rounded bg-tint/[0.03]" />
        </div>
        <div className="h-10 w-40 rounded-full bg-tint/[0.04]" />
      </div>
      <div className="mt-7 h-10 w-full max-w-md rounded-full border border-line bg-tint/[0.02]" />
      <div className="mt-8 grid gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-line bg-tint/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
