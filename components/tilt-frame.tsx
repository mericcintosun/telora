"use client";

import { useEffect, useRef } from "react";
import { animated, to, useSpring } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";
import { useCoarsePointer, useReducedMotion } from "@/components/use-reduced-motion";
import { cn } from "@/lib/utils";

/* A few degrees only: the poster leans toward the pointer, it never leaves its stage. */
const MAX_DEG = 4;

/**
 * Signature interaction 3 (K4 spring): the simulated poster leans toward a mouse pointer.
 * Purely cosmetic. It wraps the poster frame with a CSS transform, so the blur and the
 * verdict outlines (measured from the frame's own layout size) do not change. Off under
 * prefers-reduced-motion and on coarse pointers; keyboard users lose nothing, because every
 * control lives outside the frame. Server HTML renders it flat (0 degrees), fully visible.
 */
export function TiltFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const active = !reduced && !coarse;
  const [{ rx, ry }, api] = useSpring(() => ({ rx: 0, ry: 0, config: { tension: 260, friction: 18 } }));

  useEffect(() => {
    if (!active) api.start({ rx: 0, ry: 0, immediate: true });
  }, [active, api]);

  const bind = useGesture({
    onMove: ({ xy: [px, py] }) => {
      const el = ref.current;
      if (!active || !el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = Math.min(0.5, Math.max(-0.5, (px - r.left) / r.width - 0.5));
      const ny = Math.min(0.5, Math.max(-0.5, (py - r.top) / r.height - 0.5));
      api.start({ rx: -ny * 2 * MAX_DEG, ry: nx * 2 * MAX_DEG });
    },
    onHover: ({ hovering }) => {
      if (!hovering) api.start({ rx: 0, ry: 0 });
    },
  });

  return (
    <animated.div
      ref={ref}
      {...bind()}
      className={cn("will-change-transform", className)}
      style={{
        touchAction: "manipulation",
        transform: to([rx, ry], (x, y) => `perspective(900px) rotateX(${x}deg) rotateY(${y}deg)`),
      }}
    >
      {children}
    </animated.div>
  );
}
