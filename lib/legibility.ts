// The distance model behind Telora. Plain math, no network, runs on server and client.
//
// 1. Physical size: a block's cap height in mm = capHeightPct of the printed paper height.
// 2. Visual angle: at distance d the cap height subtends 2 * atan(h / 2d).
// 3. Threshold: 8 arcmin of cap height for 20/20 vision. Calibrated against the
//    NC State poster table (20 pt type is legible to roughly 7 ft): 20 pt has a cap
//    height near 4.9 mm, which subtends 7.96 arcmin at 2.13 m.
// 4. Profile and contrast scale that threshold up (20/40 doubles it, low contrast
//    pairs raise it), so maximum distance = capHeight / tan(threshold).

import type { PaperSize, PosterBlock, VisionProfile } from "@/lib/data";

export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  A3: { w: 297, h: 420 },
  A2: { w: 420, h: 594 },
  A1: { w: 594, h: 841 },
  A0: { w: 841, h: 1189 },
};

export const BASE_THRESHOLD_ARCMIN = 8;
/** Below this luminance contrast the pair has no edge left to read, whatever the size. */
export const HUE_ONLY_CONTRAST = 1.25;
export const HUE_ONLY_MAX_M = 0.6;
export const MIN_DISTANCE_M = 1;
export const MAX_DISTANCE_M = 10;
/** The 8 fixed distances the OCR pass re-reads the poster at. */
export const SCAN_DISTANCES_M = [1, 1.5, 2, 3, 4, 5, 7, 10];

const MM_PER_PT = 0.3528;
const CAP_TO_EM = 0.7;

export type Verdict = "legible" | "borderline" | "lost";

function arcminToRad(arcmin: number): number {
  return (arcmin / 60) * (Math.PI / 180);
}

export function capHeightMm(block: PosterBlock, size: PaperSize): number {
  return (block.capHeightPct / 100) * PAPER_MM[size].h;
}

export function capHeightPt(block: PosterBlock, size: PaperSize): number {
  return capHeightMm(block, size) / CAP_TO_EM / MM_PER_PT;
}

export function effectiveContrast(block: PosterBlock, profile: VisionProfile): number {
  return profile.deutan ? block.deutanContrast : block.contrast;
}

/** 1 for contrast of 7:1 or better, rising as the pair gets closer. */
export function contrastPenalty(contrast: number, sensitivity: number): number {
  if (contrast >= 7) return 1;
  return Math.pow(7 / Math.max(contrast, 1.01), 0.6 * sensitivity);
}

export function thresholdArcmin(block: PosterBlock, profile: VisionProfile): number {
  const c = effectiveContrast(block, profile);
  return BASE_THRESHOLD_ARCMIN * profile.acuityFactor * contrastPenalty(c, profile.contrastSensitivity);
}

/** Farthest distance (m) at which this block stays readable for this profile and print size. */
export function maxReadableDistanceM(block: PosterBlock, size: PaperSize, profile: VisionProfile): number {
  const capMm = capHeightMm(block, size);
  const d = capMm / Math.tan(arcminToRad(thresholdArcmin(block, profile))) / 1000;
  if (effectiveContrast(block, profile) < HUE_ONLY_CONTRAST) return Math.min(d, HUE_ONLY_MAX_M);
  return d;
}

export function verdictAt(maxDistanceM: number, distanceM: number): Verdict {
  if (distanceM <= maxDistanceM * 0.85) return "legible";
  if (distanceM <= maxDistanceM) return "borderline";
  return "lost";
}

export interface FixRecipe {
  kind: "enlarge" | "recolor";
  factor: number;
  fromPt: number;
  toPt: number;
}

/** What it takes for a block to read at the target distance, or null when it already does. */
export function fixRecipe(block: PosterBlock, size: PaperSize, profile: VisionProfile, targetM: number): FixRecipe | null {
  const maxD = maxReadableDistanceM(block, size, profile);
  if (maxD >= targetM) return null;
  const fromPt = capHeightPt(block, size);
  if (effectiveContrast(block, profile) < HUE_ONLY_CONTRAST) {
    return { kind: "recolor", factor: 1, fromPt, toPt: fromPt };
  }
  const factor = targetM / maxD;
  return { kind: "enlarge", factor, fromPt, toPt: fromPt * factor };
}

/**
 * Gaussian blur radius (CSS px) that reproduces the eye's resolution limit on a
 * preview rendered renderHeightPx tall. The poster subtends posterArcmin at distance d,
 * so one arcmin is renderHeightPx / posterArcmin pixels on screen. The blur sigma is a
 * fifth of the profile's threshold, so a block blurs out right where the model says it fails.
 */
export function blurSigmaPx(renderHeightPx: number, size: PaperSize, distanceM: number, profile: VisionProfile): number {
  const heightMm = PAPER_MM[size].h;
  const posterRad = 2 * Math.atan(heightMm / (2 * distanceM * 1000));
  const posterArcmin = (posterRad * 180 * 60) / Math.PI;
  const pxPerArcmin = renderHeightPx / posterArcmin;
  const sigmaArcmin = (BASE_THRESHOLD_ARCMIN * profile.acuityFactor) / 5;
  return sigmaArcmin * pxPerArcmin;
}

/** Vertical field of view the corridor scene stands for, in degrees (a relaxed human gaze). */
export const CORRIDOR_FOV_DEG = 30;

/**
 * Share (0 to 1) of a view `fovDeg` tall that a poster of this paper size fills at `distanceM`.
 * Same visual angle math as the verdicts: 2 atan(h / 2d), so the apparent size tracks size / distance.
 */
export function apparentHeightShare(size: PaperSize, distanceM: number, fovDeg: number = CORRIDOR_FOV_DEG): number {
  const heightMm = PAPER_MM[size].h;
  const posterDeg = (2 * Math.atan(heightMm / (2 * distanceM * 1000)) * 180) / Math.PI;
  return posterDeg / fovDeg;
}

export function formatMeters(m: number): string {
  if (m >= MAX_DISTANCE_M) return "10+ m";
  if (m < 1) return `${Math.round(m * 100)} cm`;
  return `${m.toFixed(1)} m`;
}
