"use client";

import { useEffect, useRef } from "react";

interface Blob {
  el: HTMLDivElement | null;
  // base position as viewport fractions
  bx: number;
  by: number;
  // drift motion
  ampX: number;
  ampY: number;
  speed: number;
  phase: number;
  // how strongly it follows the mouse (parallax depth) and scroll
  follow: number;
  scroll: number;
  // current eased position (px)
  x: number;
  y: number;
}

const BLOB_DEFS = [
  { bx: 0.18, by: 0.16, size: 560, hue: "var(--glow-a)", follow: 90, scroll: -0.06, ampX: 60, ampY: 40, speed: 0.00022, phase: 0 },
  { bx: 0.82, by: 0.1, size: 480, hue: "var(--glow-b)", follow: 140, scroll: -0.1, ampX: 80, ampY: 55, speed: 0.00017, phase: 2.1 },
  { bx: 0.62, by: 0.55, size: 620, hue: "var(--glow-c)", follow: 60, scroll: -0.16, ampX: 50, ampY: 70, speed: 0.00013, phase: 4.2 },
  { bx: 0.08, by: 0.72, size: 420, hue: "var(--glow-b)", follow: 110, scroll: -0.22, ampX: 70, ampY: 45, speed: 0.00019, phase: 1.2 },
];

/**
 * Fixed full-viewport "liquid" backdrop: large, heavily-blurred brand-hue
 * blobs that drift, lean toward the pointer, and parallax with scroll.
 * Pure transforms on 4 elements — cheap to animate. Honors reduced motion.
 */
export function LiquidBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(
      root.querySelectorAll<HTMLDivElement>("[data-blob]")
    );
    const blobs: Blob[] = BLOB_DEFS.map((d, i) => ({
      ...d,
      el: els[i] ?? null,
      x: 0,
      y: 0,
    }));

    // Pointer position, normalized to [-0.5, 0.5]
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const tick = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sy = window.scrollY;

      for (const b of blobs) {
        if (!b.el) continue;
        const driftX = Math.sin(t * b.speed + b.phase) * b.ampX;
        const driftY = Math.cos(t * b.speed * 1.3 + b.phase) * b.ampY;
        const targetX = b.bx * w + driftX + mx * b.follow;
        const targetY = b.by * h + driftY + my * b.follow + sy * b.scroll;
        // ease toward target — the "liquid" lag
        b.x += (targetX - b.x) * 0.06;
        b.y += (targetY - b.y) * 0.06;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    // Initialize positions to targets so there's no fly-in
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const b of blobs) {
      b.x = b.bx * w;
      b.y = b.by * h;
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BLOB_DEFS.map((d, i) => (
        <div
          key={i}
          data-blob
          className="absolute rounded-full opacity-45 blur-3xl dark:opacity-40"
          style={{
            width: d.size,
            height: d.size,
            left: 0,
            top: 0,
            transform: `translate3d(${d.bx * 100}vw, ${d.by * 100}vh, 0) translate(-50%, -50%)`,
            background: `radial-gradient(circle at 35% 35%, ${d.hue}, transparent 65%)`,
          }}
        />
      ))}
    </div>
  );
}
