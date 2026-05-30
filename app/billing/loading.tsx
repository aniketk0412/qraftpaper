// Billing makes 3+ DB calls (subscription, profile, usage row, student
// count) plus an auth() lookup before it can render anything. This
// skeleton mirrors the actual layout so the page doesn't flash blank
// for the half-second cold-cache case after a fresh deploy.
export default function BillingLoading() {
  return (
    <div className="min-h-screen lg:pl-[260px]">
      <div className="h-16 border-b border-line bg-canvas/85" />
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          {/* Hero */}
          <div className="text-center">
            <div className="mx-auto h-6 w-44 rounded-full bg-tint/[0.04]" />
            <div className="mx-auto mt-5 h-12 w-3/4 max-w-2xl rounded-2xl bg-tint/[0.05]" />
            <div className="mx-auto mt-4 h-4 w-1/2 max-w-lg rounded bg-tint/[0.03]" />
          </div>

          {/* Pricing + value stack */}
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            <div className="h-[28rem] rounded-3xl border border-line bg-tint/[0.02]" />
            <div className="h-[28rem] rounded-3xl border border-line bg-tint/[0.02]" />
          </div>

          {/* Comparison */}
          <div className="mt-16 h-[18rem] rounded-2xl border border-line bg-tint/[0.02]" />

          {/* Benefits */}
          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl border border-line bg-tint/[0.02]"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
