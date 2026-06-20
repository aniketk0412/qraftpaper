"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Global top loading bar for App Router navigations. There's no built-in
 * "navigation pending" signal in Next, so we:
 *   - start the bar when a same-origin <a> is clicked (covers nav tabs, the
 *     topbar, and any GlowButton rendered as a link),
 *   - trickle it toward ~90% while the next route streams in,
 *   - finish it to 100% and fade out when the path/query actually changes.
 *
 * Programmatic navigations (router.push, e.g. the command palette) don't fire
 * a link click, so they simply don't animate — better than a phantom flash.
 */
function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(false);

  const started = useRef(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  function clearTrickle() {
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  }

  function start() {
    if (hide.current) {
      clearTimeout(hide.current);
      hide.current = null;
    }
    if (safety.current) clearTimeout(safety.current);
    clearTrickle();
    started.current = true;
    setActive(true);
    setWidth(8);
    // Ease toward 90% — never reaching it until navigation completes.
    trickle.current = setInterval(() => {
      setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.1));
    }, 220);
    // Safety net: if a navigation never resolves, don't leave the bar stuck.
    safety.current = setTimeout(finish, 8000);
  }

  function finish() {
    if (!started.current) return;
    started.current = false;
    clearTrickle();
    if (safety.current) {
      clearTimeout(safety.current);
      safety.current = null;
    }
    setWidth(100);
    hide.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 280);
  }

  // Detect navigation start from same-origin link clicks (capture phase, so we
  // see it before Next's own handler kicks off the transition).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Same URL → no navigation will happen.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      start();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Complete when the route (path or query) actually changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Tidy up timers on unmount.
  useEffect(
    () => () => {
      clearTrickle();
      if (hide.current) clearTimeout(hide.current);
      if (safety.current) clearTimeout(safety.current);
    },
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-violet via-accent to-violet-bright transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: active ? 1 : 0,
          boxShadow:
            "0 0 12px var(--color-accent), 0 0 5px var(--color-accent)",
        }}
      />
    </div>
  );
}

export function RouteProgress() {
  // useSearchParams needs a Suspense boundary so it doesn't opt the whole tree
  // into client rendering at build time.
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
