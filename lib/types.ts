// Shared types for Telora. Every module (seed, adapter, API routes, components, OCR)
// imports its shapes from here, directly or through the lib/data.ts barrel.

export type PaperSize = "A3" | "A2" | "A1" | "A0";

/** Poster colors are limited to palette tones so no raw color lives in the code. */
export type Tone = "ink" | "ground" | "surface" | "deep" | "accent" | "onAccent" | "second" | "ok" | "bad";

export type BlockRole = "title" | "date" | "venue" | "body" | "caption" | "banner" | "byline";

export interface PosterBlock {
  id: string;
  /** Human label used in the report, for example "Event date". */
  label: string;
  role: BlockRole;
  text: string;
  /** Left edge, top edge and width as a percentage of the poster width/height. */
  x: number;
  y: number;
  w: number;
  /** Overlay height in % of poster height. Seed blocks leave it empty (text sets it); OCR blocks fill it. */
  h?: number;
  /** Capital letter height as a percentage of the poster height. */
  capHeightPct: number;
  weight: 400 | 500 | 700 | 900;
  align: "left" | "center";
  tone: Tone;
  backdrop?: Tone;
  /** WCAG-style luminance contrast against its background, normal color vision. */
  contrast: number;
  /** Same pair after the Machado 2009 deuteranopia transform. */
  deutanContrast: number;
  /** OCR confirmation at the 8 scan distances. Absent when no OCR result exists. */
  ocr?: BlockOcr;
}

/**
 * Result of re-reading one block with OCR at the 8 distances in SCAN_DISTANCES_M.
 * "live" comes from Tesseract.js in this browser; "sample" is a hand-written example value.
 */
export interface BlockOcr {
  /** Largest scan distance up to which every distance still passed. 0 means lost already at 1 m. */
  maxDistanceM: number;
  /** Share of the line's words matched at each scan distance, same order as SCAN_DISTANCES_M. */
  matchByDistance: number[];
  /** Paper size the blur was computed for. */
  size: PaperSize;
  /** Vision profile the blur was computed for. */
  profileId: VisionProfile["id"];
  basis: "live" | "sample";
}

export interface PosterRecord {
  id: string;
  title: string;
  kind: "Club event" | "Science fair" | "Academic" | "Society screening";
  owner: string;
  hangingSpot: string;
  intendedSize: PaperSize;
  intendedDistanceM: number;
  background: Tone;
  updated: string;
  blocks: PosterBlock[];
  /** Set only for posters the visitor uploads (object URL of the scanned image). */
  imageUrl?: string;
  /** Width / height of the artwork. A-series paper is 1 / 1.4142. */
  aspect?: number;
  /** Set on a corrected variant: the id of the poster it fixes. Hidden from the poster rail. */
  fixOf?: string;
  /** Set on an original that has a corrected variant: the id of that variant. */
  correctedId?: string;
}

export interface VisionProfile {
  id: "2020" | "2040" | "lowcontrast" | "deutan";
  label: string;
  note: string;
  /** Multiplies the 8 arcmin cap-height threshold. 20/40 needs letters twice as large. */
  acuityFactor: number;
  /** Exponent weight on the contrast penalty. Above 1 means contrast matters more. */
  contrastSensitivity: number;
  deutan: boolean;
}

/** Progress of the in-browser OCR scan (lib/ocr.ts). */
export interface ScanProgress {
  stage: string;
  /** 0 to 1 */
  progress: number;
}

export type AdapterMode = "fake" | "real";

/** Envelope every API route returns. */
export type ApiResponse<T> = { ok: true; data: T; mode: AdapterMode } | { ok: false; error: string; hint?: string };
