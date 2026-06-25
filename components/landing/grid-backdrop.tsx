"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide grid backdrop — an *engineering graph paper* grid, not a flat dev
 * grid. The difference (and the thing that keeps it from reading as a stock
 * template) is detail: two line weights (a fine minor grid + bolder major
 * lines every 5th), low-contrast lines so it's texture not decoration, a teal
 * focal bloom up top, and a cursor-following glow that lights the grid up
 * under the pointer.
 *
 * Layout: absolutely positioned to fill its wrapper, which wraps the whole
 * landing page (see app/page.tsx), so the grid spans the full document height
 * and scrolls with the content. Sections are transparent over the body canvas,
 * so the grid shows through while opaque cards sit on top.
 *
 * Performance: filter-free. Grid lines and glows are plain
 * gradients/backgrounds (cheap to composite), NOT `filter: blur()` and NOT a
 * full-document `mask-image` grid copy (an earlier version did the latter and
 * pinned the compositor). The cursor glow is an additive radial-gradient laid
 * OVER the grid, so the lines appear to illuminate without masking a second
 * grid. It's driven by two CSS custom properties (--mx / --my) written
 * straight to the node on pointermove, so React never re-renders on mouse
 * movement; coordinates are document-space (pageX/pageY).
 *
 * Accessibility: the moving glow is decorative. Under prefers-reduced-motion
 * we leave the static grid + blooms and skip pointer tracking.
 */
export function GridBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty("--mx", `${e.pageX}px`);
        el.style.setProperty("--my", `${e.pageY}px`);
        el.style.setProperty("--on", "1");
      });
    };
    const onLeave = () => el.style.setProperty("--on", "0");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Shared horizontal edge-fade so grid lines dissolve at the viewport sides
  // instead of hard-cutting. Applied to both grid layers.
  const edgeFade =
    "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]";

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [--mx:50%] [--my:300px] [--on:0]"
    >
      {/* Focal bloom — teal at the hero, violet off to the side. Gives the grid
          a coloured centre of gravity so it isn't an even, lifeless field. */}
      <div
        className="absolute inset-x-0 top-0 h-[64rem]"
        style={{
          background: `
            radial-gradient(64rem 38rem at 12% -2%, color-mix(in srgb, var(--color-accent) 11%, transparent), transparent 62%),
            radial-gradient(56rem 36rem at 100% 16%, color-mix(in srgb, var(--color-violet) 8%, transparent), transparent 62%)`,
        }}
      />

      {/* Minor grid — the fine ruling. Low contrast so it's a whisper. */}
      <div
        className={`absolute inset-0 opacity-[0.45] ${edgeFade}`}
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--color-line-strong) 40%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--color-line-strong) 40%, transparent) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Major grid — bolder lines every 5th cell, like graph paper's heavier
          rule. This second weight is what reads as "designed" vs "default". */}
      <div
        className={`absolute inset-0 opacity-[0.55] ${edgeFade}`}
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--color-line-strong) 70%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--color-line-strong) 70%, transparent) 1px, transparent 1px)`,
          backgroundSize: "150px 150px",
        }}
      />

      {/* Cursor glow — additive teal radial OVER the grid, so the lines beneath
          light up under the pointer. Brighter core than the ambient blooms so
          the interaction is felt. --on fades it in/out with pointer presence. */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: "var(--on)",
          background:
            "radial-gradient(circle 18rem at var(--mx) var(--my), color-mix(in srgb, var(--color-accent) 20%, transparent), color-mix(in srgb, var(--color-accent) 7%, transparent) 36%, transparent 64%)",
        }}
      />
    </div>
  );
}
