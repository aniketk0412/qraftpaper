"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";

function LenisBridge() {
  const lenis = useLenis();
  useEffect(() => {
    if (lenis && process.env.NODE_ENV === "development") {
      (window as unknown as { lenis?: unknown }).lenis = lenis;
    }
  }, [lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
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
