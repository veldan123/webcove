"use client";

import { useEffect, useRef } from "react";

/**
 * Watercolor liquid backdrop. Eight color zones — pink, cyan, amber, violet,
 * emerald, indigo, magenta, azure — are spread across the whole viewport like
 * pigments on wet paper. The cursor acts as a brush: colors NEAR it are drawn
 * toward it and bleed into each other locally, then spring back to their home
 * region once the cursor moves on. Distant colors stay put, so the page is
 * always a full-screen patchwork, never one pile-up.
 *
 * Each hue also slowly wanders, and the field drifts + parallaxes with scroll.
 * Rendered at 1/4 resolution + CSS blur for cheap 60fps; reduced motion gets
 * a static frame.
 */

interface Blob {
  hx: number; // home position (viewport fractions)
  hy: number;
  ampX: number; // idle drift
  ampY: number;
  speed: number;
  phase: number;
  scroll: number;
  r: number; // radius as fraction of min(vw, vh)
  hue: number;
  hueDrift: number;
  sat: number;
  pulse: number;
  x: number;
  y: number;
}

// Homes tile the screen — every corner and the middle holds a different color.
const DEFS: Omit<Blob, "x" | "y">[] = [
  { hx: 0.12, hy: 0.15, hue: 330, hueDrift: 20, sat: 88, r: 0.34, pulse: 0.09, ampX: 50, ampY: 40, speed: 0.00016, phase: 0.3, scroll: -0.06 }, // pink
  { hx: 0.5, hy: 0.1, hue: 195, hueDrift: 25, sat: 90, r: 0.32, pulse: 0.1, ampX: 60, ampY: 35, speed: 0.00013, phase: 1.4, scroll: -0.1 },   // cyan
  { hx: 0.88, hy: 0.16, hue: 42, hueDrift: 14, sat: 95, r: 0.3, pulse: 0.08, ampX: 55, ampY: 45, speed: 0.00018, phase: 2.2, scroll: -0.07 }, // amber
  { hx: 0.16, hy: 0.55, hue: 268, hueDrift: 22, sat: 85, r: 0.34, pulse: 0.11, ampX: 45, ampY: 55, speed: 0.00012, phase: 3.1, scroll: -0.12 }, // violet
  { hx: 0.55, hy: 0.5, hue: 152, hueDrift: 18, sat: 78, r: 0.3, pulse: 0.1, ampX: 65, ampY: 50, speed: 0.00015, phase: 4.0, scroll: -0.15 },  // emerald
  { hx: 0.88, hy: 0.55, hue: 235, hueDrift: 25, sat: 85, r: 0.33, pulse: 0.09, ampX: 50, ampY: 60, speed: 0.00014, phase: 4.9, scroll: -0.11 }, // indigo
  { hx: 0.28, hy: 0.9, hue: 305, hueDrift: 28, sat: 82, r: 0.34, pulse: 0.1, ampX: 60, ampY: 40, speed: 0.00011, phase: 5.6, scroll: -0.18 },  // magenta
  { hx: 0.75, hy: 0.92, hue: 210, hueDrift: 24, sat: 88, r: 0.36, pulse: 0.09, ampX: 70, ampY: 45, speed: 0.0001, phase: 0.9, scroll: -0.2 },  // azure
];

export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Dark: additive glow. Light: vivid pastel layering (additive washes out
    // on white, multiply muddies complementary hues — plain layering + blur
    // reads as watercolor).
    const LIGHTNESS = isDark ? 52 : 66;
    const ALPHA = isDark ? 0.42 : 0.5;
    const COMPOSITE: GlobalCompositeOperation = isDark
      ? "lighter"
      : "source-over";

    const SCALE = 0.25;
    let w = 0;
    let h = 0;

    const blobs: Blob[] = DEFS.map((d) => ({ ...d, x: 0, y: 0 }));

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(2, Math.round(w * SCALE));
      canvas.height = Math.max(2, Math.round(h * SCALE));
    };
    resize();
    window.addEventListener("resize", resize);

    // Cursor starts off-screen so the field opens as an even patchwork.
    let mx = -10000;
    let my = -10000;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    for (const b of blobs) {
      b.x = b.hx * w;
      b.y = b.hy * h;
    }

    const draw = (t: number) => {
      const s = SCALE;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = COMPOSITE;

      // Brush: how far the cursor's pull reaches, and how hard it tugs.
      const reach = Math.min(w, h) * 0.38;
      const pullStrength = Math.min(w, h) * 0.22;

      for (const b of blobs) {
        const radius =
          Math.min(w, h) *
          b.r *
          (1 + b.pulse * Math.sin(t * 0.0006 + b.phase * 3));

        // Home + idle drift + scroll parallax
        let targetX = b.hx * w + Math.sin(t * b.speed + b.phase) * b.ampX;
        let targetY =
          b.hy * h +
          Math.cos(t * b.speed * 1.3 + b.phase) * b.ampY +
          window.scrollY * b.scroll;

        // Local brush pull: nearby colors lean toward the cursor and bleed
        // together; falloff is gaussian so distant colors don't move at all.
        const dx = mx - b.x;
        const dy = my - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < reach * 2.5 && dist > 0.001) {
          const falloff = Math.exp(-(dist * dist) / (reach * reach));
          targetX += (dx / dist) * pullStrength * falloff;
          targetY += (dy / dist) * pullStrength * falloff;
        }

        // Ease toward target — wet-paint lag
        b.x += (targetX - b.x) * 0.045;
        b.y += (targetY - b.y) * 0.045;

        const hue = b.hue + Math.sin(t * 0.00012 + b.phase) * b.hueDrift;
        const g = ctx.createRadialGradient(
          b.x * s,
          b.y * s,
          0,
          b.x * s,
          b.y * s,
          radius * s
        );
        g.addColorStop(0, `hsla(${hue}, ${b.sat}%, ${LIGHTNESS}%, ${ALPHA})`);
        g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x * s, b.y * s, radius * s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ filter: "blur(48px) saturate(1.35)" }}
      />
    </div>
  );
}
