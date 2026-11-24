"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TONE_VAR, type PaperSize, type PosterRecord, type VisionProfile } from "@/lib/data";
import { blurSigmaPx, formatMeters, type Verdict } from "@/lib/legibility";

const A_SERIES_ASPECT = 1 / Math.SQRT2;
const SSR_HEIGHT_PX = 560;
const DISPLAY_STACK = 'var(--font-rh-display), "Segoe UI", system-ui, sans-serif';

/* Machado, Oliveira and Fernandes (2009), deuteranopia at severity 1.0. */
const DEUTAN_MATRIX = "0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0";

const OUTLINE: Record<Verdict, string> = {
  legible: "outline-ok",
  borderline: "outline-warn",
  lost: "outline-bad",
};
const CHIP: Record<Verdict, string> = {
  legible: "bg-ok",
  borderline: "bg-warn",
  lost: "bg-bad",
};

export interface BlockScore {
  maxDistanceM: number;
  verdict: Verdict;
}

/**
 * The poster as a viewer at `distanceM` sees it. The artwork layer is blurred by the
 * eye's resolution limit for the chosen print size and vision profile; the verdict layer
 * sits on top, unblurred, and outlines every text block in OK, WARN or BAD.
 */
export function SimulatedPoster({
  poster,
  size,
  distanceM,
  profile,
  scores,
  showVerdicts,
  compact = false,
}: {
  poster: PosterRecord;
  size: PaperSize;
  distanceM: number;
  profile: VisionProfile;
  scores: Record<string, BlockScore>;
  showVerdicts: boolean;
  /** Outlines only, no "Label: N m max" chips. The corridor view hangs the poster too small for them. */
  compact?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [heightPx, setHeightPx] = useState(SSR_HEIGHT_PX);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeightPx(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sigma = blurSigmaPx(heightPx, size, distanceM, profile);
  const filters = [
    profile.deutan ? "url(#telora-deutan)" : "",
    `blur(${sigma.toFixed(2)}px)`,
    profile.id === "lowcontrast" ? "contrast(0.55)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const fontPx = (capHeightPct: number) => ((capHeightPct / 100) * heightPx) / 0.7;
  const aspect = poster.aspect ?? A_SERIES_ASPECT;
  // Portrait sheets size by height. A landscape upload sizes by width instead, capped by the
  // stage height through container units (the flat stage is a size container), so a phone
  // no longer squeezes it sideways.
  const landscape = aspect > 1;

  return (
    <div
      ref={frameRef}
      className={cn("relative max-w-full overflow-hidden rounded-2xl shadow-lift", landscape ? "h-auto" : "h-full")}
      style={{
        aspectRatio: aspect,
        background: TONE_VAR[poster.background],
        width: landscape ? `min(100%, ${(aspect * 100).toFixed(2)}cqh)` : undefined,
      }}
    >
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="telora-deutan" colorInterpolationFilters="linearRGB">
          <feColorMatrix type="matrix" values={DEUTAN_MATRIX} />
        </filter>
      </svg>

      <div className="absolute inset-0" style={{ filter: filters }} aria-hidden="true">
        {poster.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster.imageUrl} alt="" className="h-full w-full object-fill" />
        ) : (
          poster.blocks.map((b) => (
            <div
              key={b.id}
              className="absolute"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.w}%`,
                fontSize: fontPx(b.capHeightPct),
                fontWeight: b.weight,
                lineHeight: 1.15,
                textAlign: b.align,
                color: TONE_VAR[b.tone],
                background: b.backdrop ? TONE_VAR[b.backdrop] : undefined,
                padding: b.backdrop ? "0.25em 0.45em" : undefined,
                borderRadius: b.backdrop ? "0.35em" : undefined,
                fontFamily: b.role === "title" || b.role === "banner" ? DISPLAY_STACK : undefined,
              }}
            >
              {b.text}
            </div>
          ))
        )}
      </div>

      {showVerdicts && (
        <div className="absolute inset-0">
          {poster.blocks.map((b) => {
            const score = scores[b.id];
            if (!score) return null;
            return (
              <div
                key={b.id}
                className={cn("absolute rounded-lg outline-2 outline-offset-2 outline-solid", OUTLINE[score.verdict])}
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}%`,
                  height: b.h !== undefined ? `${b.h}%` : undefined,
                  fontSize: fontPx(b.capHeightPct),
                  fontWeight: b.weight,
                  lineHeight: 1.15,
                  textAlign: b.align,
                  color: "transparent",
                  padding: b.backdrop ? "0.25em 0.45em" : undefined,
                  fontFamily: b.role === "title" || b.role === "banner" ? DISPLAY_STACK : undefined,
                }}
              >
                {b.h === undefined ? b.text : null}
                {!compact && (
                  <span
                    key={score.verdict}
                    className={cn(
                      "telora-enter absolute -top-6 left-0 rounded-full px-2 py-0.5 font-sans text-2xs font-semibold leading-tight whitespace-nowrap text-on-accent",
                      CHIP[score.verdict]
                    )}
                  >
                    {b.label}: {formatMeters(score.maxDistanceM)} max
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <span className="sr-only">
        {poster.title} simulated at {distanceM.toFixed(1)} metres on {size} paper for {profile.label} vision.
      </span>
    </div>
  );
}
