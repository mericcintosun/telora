"use client";

import { useEffect, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useReducedMotion } from "@/components/use-reduced-motion";
import { cn } from "@/lib/utils";

/* Half circle from (10,50) to (90,50), radius 40. */
const ARC_LEN = Math.PI * 40;
/* Low friction so the needle swings past the value and settles back. */
const SETTLE = { tension: 320, friction: 9 };

/**
 * Signature interaction 2 (K4 spring): "N of M lines readable" as a needle gauge.
 * `readable` and `total` come from the lab's scores (maxReadableDistanceM and verdictAt in
 * lib/legibility.ts, over the seed or uploaded blocks). The needle springs to the new share,
 * overshoots and settles whenever it changes, and gets a small kick when the poster, paper
 * size or vision profile changes (`settleKey`). The figure itself is plain text in the DOM,
 * so it reads with JavaScript off; reduced motion moves the needle with `immediate`.
 */
export function LinesGauge({
  readable,
  total,
  distanceM,
  settleKey,
}: {
  readable: number;
  total: number;
  distanceM: number;
  settleKey: string;
}) {
  const reduced = useReducedMotion();
  const share = total > 0 ? readable / total : 0;
  const [{ p }, api] = useSpring(() => ({ p: share }));
  const last = useRef<{ share: number; key: string } | null>(null);

  useEffect(() => {
    const prev = last.current;
    last.current = { share, key: settleKey };
    if (!prev) return;
    if (reduced) {
      api.start({ p: share, immediate: true });
      return;
    }
    if (prev.share === share) {
      // Same count, new poster, size or profile: a short swing so the change still registers.
      api.start({ from: { p: Math.max(0, share - 0.18) }, to: { p: share }, config: SETTLE });
      return;
    }
    api.start({ p: share, config: SETTLE });
  }, [share, settleKey, reduced, api]);

  if (total === 0) {
    return <p className="text-sm font-semibold text-muted-foreground">No text lines to score</p>;
  }

  const allRead = readable === total;
  const needle = p.to((v) => `rotate(${(Math.min(1.08, Math.max(-0.08, v)) - 0.5) * 180}deg)`);
  const fillOffset = p.to((v) => ARC_LEN * (1 - Math.min(1, Math.max(0, v))));

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 56" className="h-10 w-[4.5rem] shrink-0" aria-hidden="true">
        <path d="M10 50 A40 40 0 0 1 90 50" fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-border" />
        <animated.path
          d="M10 50 A40 40 0 0 1 90 50"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          strokeDashoffset={fillOffset}
          className={allRead ? "stroke-ok" : "stroke-bad"}
        />
        <animated.line
          x1="50"
          y1="50"
          x2="50"
          y2="18"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-ink"
          style={{ transform: needle, transformOrigin: "50px 50px", transformBox: "view-box" }}
        />
        <circle cx="50" cy="50" r="6" className="fill-ink" />
      </svg>
      <p className="min-w-0 text-sm leading-tight" aria-live="polite">
        <span className={cn("font-display text-2xl font-black", allRead ? "text-ok" : "text-bad")}>
          {readable} of {total}
        </span>{" "}
        <span className="font-semibold">lines readable</span>
        <span className="block text-xs text-muted-foreground">at {distanceM.toFixed(1)} m</span>
      </p>
    </div>
  );
}
