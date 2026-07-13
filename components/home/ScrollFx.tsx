"use client";

import { useEffect, useRef } from "react";

/**
 * Arms scroll-reveal (adds `js-reveal` to <html>, then reveals `[data-reveal]`
 * elements via IntersectionObserver) and drives the top scroll-progress bar.
 * Everything is visible without JS; reduced motion disables the hide entirely
 * (handled in globals.css).
 */
export function ScrollFx() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // ---- reveal on scroll ----
    let observer: IntersectionObserver | null = null;
    if (!reduced && "IntersectionObserver" in window) {
      document.documentElement.classList.add("js-reveal");
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => observer!.observe(el));
    }

    // ---- scroll progress bar ----
    let raf = 0;
    const update = () => {
      const bar = barRef.current;
      if (bar) {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        bar.style.transform = `scaleX(${p})`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      observer?.disconnect();
      document.documentElement.classList.remove("js-reveal");
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
