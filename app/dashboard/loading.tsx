// Shown instantly on navigation to any dashboard tab while the server
// component renders — so a tab never sits blank.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-8 w-64 rounded-lg bg-tint/[0.05]" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-tint/[0.03]" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-line bg-tint/[0.02]"
          />
        ))}
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-2xl border border-line bg-tint/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
