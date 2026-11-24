"use client";

import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/components/use-reduced-motion";
import type { PosterRecord, VisionProfile } from "@/lib/data";
import { maxReadableDistanceM } from "@/lib/legibility";

/* Widest card; on a narrow screen a card shrinks to the rail's width so one whole card shows. */
const CARD_W = 232;
const MIN_CARD_W = 180;
const GAP = 12;

/**
 * Signature interaction 1 (K4 spring): a throwable rail of the seed posters.
 * Drag or flick it; the release velocity projects where the rail would coast to,
 * the nearest poster becomes the one loaded in the lab, and a spring settles the rail.
 * Prev/next buttons and plain clicks do the same for keyboard and pointer users.
 */
export function PosterDeck({
  posters: allPosters,
  activeId: requestedActiveId,
  onSelect,
  profile,
}: {
  posters: PosterRecord[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Profile used for the "N blocks lost at the spot" line on each card (20/20 baseline). */
  profile: VisionProfile;
}) {
  // Corrected variants (fixOf set) stay off the rail; they open from the report. While one is
  // open, its original stays highlighted so the rail still shows where you are.
  const posters = allPosters.filter((p) => !p.fixOf);
  const activeId = allPosters.find((p) => p.id === requestedActiveId)?.fixOf ?? requestedActiveId;
  const reduced = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [maxScroll, setMaxScroll] = useState(0);
  const [cardW, setCardW] = useState(CARD_W);
  const step = cardW + GAP;
  const index = Math.max(0, posters.findIndex((p) => p.id === activeId));

  const restingX = (i: number) => Math.max(-maxScroll, Math.min(0, -i * step));
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(MIN_CARD_W, Math.min(CARD_W, el.clientWidth));
      setCardW(w);
      setMaxScroll(Math.max(0, posters.length * (w + GAP) - GAP - el.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [posters.length]);

  useEffect(() => {
    api.start({ x: Math.max(-maxScroll, Math.min(0, -index * step)), immediate: reduced });
  }, [index, maxScroll, step, reduced, api]);

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], direction: [dx], last, memo }) => {
      const start: number = memo ?? x.get();
      if (!last) {
        if (Math.abs(mx) > 6) draggedRef.current = true;
        api.start({ x: start + mx, immediate: down });
        return start;
      }
      // Throw: velocity (px/ms) carries the rail further than the finger did.
      const projected = start + mx + dx * vx * 220;
      const next = Math.max(0, Math.min(posters.length - 1, Math.round(-projected / step)));
      const delta = Math.round(-(mx + dx * vx * 220) / step);
      const target = maxScroll === 0 ? Math.max(0, Math.min(posters.length - 1, index + delta)) : next;
      api.start({ x: restingX(target), immediate: reduced, config: { tension: 240, friction: 24 } });
      if (draggedRef.current && target !== index) onSelect(posters[target].id);
      return start;
    },
    { axis: "x", filterTaps: true, pointer: { touch: true } }
  );

  if (posters.length === 0) {
    return (
      <p className="telora-panel max-w-none bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
        No example posters on the rail yet. Drop your own file in the upload card below and the lab scores every
        line it finds.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous poster"
        disabled={index === 0}
        onClick={() => onSelect(posters[Math.max(0, index - 1)].id)}
      >
        <ChevronLeft />
      </Button>
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden rounded-2xl">
        <animated.div
          {...bind()}
          style={{ x, touchAction: "pan-y" }}
          className="flex cursor-grab select-none gap-3 py-1 active:cursor-grabbing"
          role="list"
          aria-label="Example posters, drag or throw to switch"
        >
          {posters.map((p, i) => {
            const lost = p.blocks.filter(
              (b) => maxReadableDistanceM(b, p.intendedSize, profile) < p.intendedDistanceM
            ).length;
            return (
              <div role="listitem" key={p.id} className="shrink-0" style={{ width: cardW }}>
                <Button
                  variant="choice"
                  aria-pressed={p.id === activeId}
                  onClick={() => {
                    if (draggedRef.current) {
                      draggedRef.current = false;
                      return;
                    }
                    onSelect(p.id);
                  }}
                  onPointerDown={() => {
                    draggedRef.current = false;
                  }}
                  className="h-auto w-full flex-col items-start gap-1 whitespace-normal rounded-2xl p-4 text-left"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                    {p.kind}, {p.intendedSize} at {p.intendedDistanceM} m
                  </span>
                  <span className="font-display text-base font-bold leading-snug">{p.title}</span>
                  <span className="text-xs opacity-80">
                    {lost === 0 ? "Every block reads at the spot" : `${lost} of ${p.blocks.length} blocks lost at the spot`}
                  </span>
                </Button>
              </div>
            );
          })}
        </animated.div>
      </div>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next poster"
        disabled={index === posters.length - 1}
        onClick={() => onSelect(posters[Math.min(posters.length - 1, index + 1)].id)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
