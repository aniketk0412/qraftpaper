export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-canvas" />
      {/* Dual-weight blueprint grid — fine 28px ink hairlines layered with
          heavier 140px major lines in brand indigo, the way an architect's
          plate or a ledger reads. Theme-aware via the --bg-grid-* tokens, and
          masked to a soft ellipse at the top so it's a texture that fades into
          the page, not a flat full-bleed graph-paper tile. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to right, var(--bg-grid-fine) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--bg-grid-fine) 1px, transparent 1px)",
            "linear-gradient(to right, var(--bg-grid-major) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--bg-grid-major) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "28px 28px, 28px 28px, 140px 140px, 140px 140px",
          maskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 35%, transparent 100%)",
        }}
      />
      {/* Paper grain. */}
      <div className="bg-noise absolute inset-0 opacity-[0.04] mix-blend-overlay" />
      {/* Faint vignette so the corners settle into the sheet. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 75% at 50% 30%, transparent 60%, var(--bg-vignette) 100%)",
        }}
      />
    </div>
  );
}
