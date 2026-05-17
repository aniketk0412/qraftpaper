export function SiteBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-canvas" />
      {/* a single restrained violet halo at the very top — no page-wide wash */}
      <div className="absolute -top-[26rem] left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-violet/[0.07] blur-[160px]" />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 75% 55% at 50% 0%, #000 30%, transparent 100%)",
        }}
      />
      <div className="bg-noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 35%, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}
