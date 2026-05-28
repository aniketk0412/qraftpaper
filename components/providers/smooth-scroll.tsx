"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

function LenisBridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (lenis && process.env.NODE_ENV === "development") {
      (window as unknown as { lenis?: unknown }).lenis = lenis;
    }
  }, [lenis]);
  return null;
}

/**
 * Lenis smooth-scroll fights native trackpad inertia on macOS and conflicts
 * with `prefers-reduced-motion`. Skip it entirely for those users — the page
 * stays fully usable, just with native scrolling. Same pattern as CursorGlow.
 */
function useSmoothScrollEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setEnabled(!reduced.matches);
    decide();
    reduced.addEventListener("change", decide);
    return () => reduced.removeEventListener("change", decide);
  }, []);
  return enabled;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const enabled = useSmoothScrollEnabled();
  if (!enabled) return <>{children}</>;
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        anchors: true,
      }}
    >
      <LenisBridge />
      {children}
    </ReactLenis>
  );
}
