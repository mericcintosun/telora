"use client";

import { useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { LabEmptyState } from "@/components/lab-states";
import { SimulatedPoster, type BlockScore } from "@/components/simulated-poster";
import { cn } from "@/lib/utils";
import type { PaperSize, PosterRecord, VisionProfile } from "@/lib/data";
import { CORRIDOR_FOV_DEG, apparentHeightShare, formatMeters, type Verdict } from "@/lib/legibility";

const A_SERIES_ASPECT = 1 / Math.SQRT2;
/* Scene geometry in percent of the stage: ceiling edge, floor edge, side wall depth. */
const CEILING_PCT = 10;
const FLOOR_PCT = 80;
const SIDE_PCT = 12;
/* The poster never hangs taller than the back wall, and never shrinks to nothing. */
const MAX_SHARE = (FLOOR_PCT - CEILING_PCT - 4) / 100;
const MIN_SHARE = 0.02;

export const CORRIDOR_EMPTY_MESSAGE =
  "Pick an example poster or drop your own file, then the corridor shows it on the wall.";

const DOT: Record<Verdict, string> = { legible: "bg-ok", borderline: "bg-warn", lost: "bg-bad" };
const WORD: Record<Verdict, string> = { legible: "reads", borderline: "borderline", lost: "lost" };

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * DEMO step 8: the same simulated poster hung on a hallway wall at the chosen distance.
 * Its apparent height is the visual angle of the printed sheet (apparentHeightShare in
 * lib/legibility.ts) against a fixed field of view, so it tracks size / distance. The outlines
 * and the caption reuse the lab's scores, which come from maxReadableDistanceM; nothing new is computed.
 * A spring settles the height when the distance changes; reduced motion jumps straight there.
 */
export function CorridorView({
  poster,
  size,
  distanceM,
  profile,
  scores,
  showVerdicts,
}: {
  poster: PosterRecord | undefined;
  size: PaperSize;
  distanceM: number;
  profile: VisionProfile;
  scores: Record<string, BlockScore>;
  showVerdicts: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const share = Math.min(MAX_SHARE, Math.max(MIN_SHARE, apparentHeightShare(size, distanceM)));
  const spring = useSpring({ h: share * 100, immediate: reduced, config: { tension: 210, friction: 26 } });

  if (!poster || poster.blocks.length === 0) {
    return <LabEmptyState message={CORRIDOR_EMPTY_MESSAGE} />;
  }

  const rows = poster.blocks
    .filter((b) => scores[b.id])
    .sort((a, b) => scores[a.id].maxDistanceM - scores[b.id].maxDistanceM);
  const readable = rows.filter((b) => scores[b.id].verdict !== "lost").length;
  const aspect = poster.aspect ?? A_SERIES_ASPECT;

  return (
    <figure className="flex w-full max-w-full flex-col gap-3">
      <div
        className="relative h-[min(60vh,34rem)] min-h-[20rem] w-full max-w-full overflow-hidden rounded-2xl border border-border bg-deep"
      >
        {/* Ceiling, side walls and floor: flat token panels cut to a one-point perspective. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 bg-background"
          style={{
            height: `${CEILING_PCT}%`,
            clipPath: `polygon(0 0, 100% 0, ${100 - SIDE_PCT}% 100%, ${SIDE_PCT}% 100%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-surface"
          style={{
            width: `${SIDE_PCT}%`,
            clipPath: `polygon(0 0, 100% ${CEILING_PCT}%, 100% ${FLOOR_PCT}%, 0 100%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 bg-surface"
          style={{
            width: `${SIDE_PCT}%`,
            clipPath: `polygon(0 ${CEILING_PCT}%, 100% 0, 100% 100%, 0 ${FLOOR_PCT}%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-surface"
          style={{
            height: `${100 - FLOOR_PCT}%`,
            clipPath: `polygon(${SIDE_PCT}% 0, ${100 - SIDE_PCT}% 0, 100% 100%, 0 100%)`,
          }}
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full stroke-border"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <line x1="0" y1="0" x2={SIDE_PCT} y2={CEILING_PCT} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2={100 - SIDE_PCT} y2={CEILING_PCT} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="100" x2={SIDE_PCT} y2={FLOOR_PCT} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="100" x2={100 - SIDE_PCT} y2={FLOOR_PCT} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1={SIDE_PCT} y1={FLOOR_PCT} x2={100 - SIDE_PCT} y2={FLOOR_PCT} strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <line x1={SIDE_PCT} y1={CEILING_PCT} x2={100 - SIDE_PCT} y2={CEILING_PCT} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* The poster on the back wall, centred at eye level. Height is the only animated value. */}
        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top: `${CEILING_PCT}%`, height: `${FLOOR_PCT - CEILING_PCT}%` }}
        >
          <animated.div
            className="max-w-[74%]"
            style={{ height: spring.h.to((v) => `${(v / (FLOOR_PCT - CEILING_PCT)) * 100}%`), aspectRatio: aspect }}
          >
            <SimulatedPoster
              poster={poster}
              size={size}
              distanceM={distanceM}
              profile={profile}
              scores={scores}
              showVerdicts={showVerdicts}
              compact
            />
          </animated.div>
        </div>

        <p className="absolute bottom-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1 text-center text-xs font-semibold shadow-panel">
          You stand {distanceM.toFixed(1)} m away, {size} on the wall
        </p>
      </div>

      <figcaption className="flex flex-col gap-2">
        <p className="text-sm" aria-live="polite">
          <strong className={readable === rows.length ? "text-ok" : "text-bad"}>
            {readable} of {rows.length} lines readable at {distanceM.toFixed(1)} m.
          </strong>{" "}
          <span className="text-muted-foreground">
            The view spans about {CORRIDOR_FOV_DEG} degrees top to bottom, so the poster is as tall as it looks from
            that spot.
          </span>
        </p>
        <ul className="flex flex-wrap gap-2" aria-label="Lines on the wall, weakest first">
          {rows.map((b) => {
            const s = scores[b.id];
            return (
              <li
                key={b.id}
                className="flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"
              >
                <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", DOT[s.verdict])} />
                <span className="truncate">
                  <strong>{b.label}</strong>: {formatMeters(s.maxDistanceM)} max, {WORD[s.verdict]}
                </span>
              </li>
            );
          })}
        </ul>
      </figcaption>
    </figure>
  );
}
