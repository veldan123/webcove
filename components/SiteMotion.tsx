"use client";

import { useEffect } from "react";

// Reveals [data-reveal] sections as they scroll into view. Content is visible by
// default (SEO / no-JS safe); this arms the hidden state on the client, then
// fades sections up. Uses a scroll check (not just IntersectionObserver) so a
// fast jump can never leave a section stuck invisible. Works on the live site
// (window scroll) and in the editor preview (an inner scroll container).
function scrollParent(el: HTMLElement): HTMLElement | null {
  let p = el.parentElement;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === "auto" || oy === "scroll") return p;
    p = p.parentElement;
  }
  return null;
}

export function SiteMotion() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (reduce || els.length === 0) return; // leave everything visible

    els.forEach((el) => el.classList.add("wc-reveal"));
    const root = scrollParent(els[0]);

    let raf = 0;
    const check = () => {
      raf = 0;
      const rb = root ? root.getBoundingClientRect() : null;
      const viewportBottom = rb ? rb.bottom : window.innerHeight;
      const height = rb ? rb.height : window.innerHeight;
      const trigger = viewportBottom - height * 0.08; // reveal a touch early
      for (const el of els) {
        if (el.classList.contains("wc-in")) continue;
        if (el.getBoundingClientRect().top < trigger) el.classList.add("wc-in");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    const target: HTMLElement | Window = root ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check(); // reveal whatever's already in view

    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
