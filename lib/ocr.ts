// Poster scanning adapter. Browser only: call it from a "use client" component.
//
// REAL today: Tesseract.js (loaded with a dynamic import, runs in its own Web Worker)
// finds every text line on the uploaded poster with its bounding box; the canvas then
// measures each line's luminance contrast, both as-is and after the Machado 2009
// deuteranopia transform. lib/legibility.ts turns that geometry into distances.
//
// NEXT: confirm the arcmin estimate by re-reading the blurred poster at the 8 fixed
// distances in SCAN_DISTANCES_M and recording where the word match drops (see HANDOFF.md).

import type { PosterBlock, PosterRecord } from "@/lib/data";

export interface ScanProgress {
  stage: string;
  /** 0 to 1 */
  progress: number;
}

interface OcrBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
interface OcrLine {
  text: string;
  confidence: number;
  bbox: OcrBox;
}
interface OcrPage {
  blocks: { paragraphs: { lines: OcrLine[] }[] }[] | null;
}

const LONG_EDGE_PX = 1600;
const MIN_CONFIDENCE = 55;
/** A text line's box runs from ascender to descender; capitals fill about 62% of it. */
const CAP_OF_LINE_BOX = 0.62;
const DATE_PATTERN = /\b(\d{1,2}[:.]\d{2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|(mon|tue|wed|thu|fri|sat|sun)\w*day)\b/i;

const DEUTAN = [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881];

function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast between the 10th and 90th luminance percentile inside a box. */
function measureContrast(ctx: CanvasRenderingContext2D, box: OcrBox, deutan: boolean): number {
  const w = Math.max(1, Math.round(box.x1 - box.x0));
  const h = Math.max(1, Math.round(box.y1 - box.y0));
  const { data } = ctx.getImageData(Math.round(box.x0), Math.round(box.y0), w, h);
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 16) {
    let r = toLinear(data[i]);
    let g = toLinear(data[i + 1]);
    let b = toLinear(data[i + 2]);
    if (deutan) {
      const nr = DEUTAN[0] * r + DEUTAN[1] * g + DEUTAN[2] * b;
      const ng = DEUTAN[3] * r + DEUTAN[4] * g + DEUTAN[5] * b;
      const nb = DEUTAN[6] * r + DEUTAN[7] * g + DEUTAN[8] * b;
      r = Math.min(1, Math.max(0, nr));
      g = Math.min(1, Math.max(0, ng));
      b = Math.min(1, Math.max(0, nb));
    }
    values.push(luminance(r, g, b));
  }
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.1)] ?? 0;
  const hi = values[Math.floor(values.length * 0.9)] ?? 1;
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

async function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { img, url };
}

/**
 * Scans an uploaded poster image and returns it as a PosterRecord the lab can render.
 * Throws when the OCR engine cannot load (offline, blocked CDN) or finds no text.
 */
export async function scanPosterImage(file: File, onProgress: (p: ScanProgress) => void): Promise<PosterRecord> {
  onProgress({ stage: "Reading the image", progress: 0.05 });
  const { img, url } = await loadImage(file);

  const scale = Math.min(1, LONG_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("This browser cannot draw to a canvas.");
  ctx.drawImage(img, 0, 0, W, H);

  onProgress({ stage: "Loading the OCR engine (about 4 MB, cached after the first run)", progress: 0.12 });
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress({ stage: "Finding text blocks", progress: 0.3 + m.progress * 0.6 });
      }
    },
  });

  let page: OcrPage;
  try {
    const result = await worker.recognize(canvas, {}, { blocks: true });
    page = result.data as unknown as OcrPage;
  } finally {
    await worker.terminate();
  }

  onProgress({ stage: "Measuring contrast per line", progress: 0.94 });
  const lines: OcrLine[] = (page.blocks ?? [])
    .flatMap((b) => b.paragraphs)
    .flatMap((p) => p.lines)
    .filter((l) => l.confidence >= MIN_CONFIDENCE && l.text.trim().length >= 2);

  if (lines.length === 0) {
    throw new Error("No readable text found. Try a flatter export (PNG at 150 dpi or more) or a sharper photo.");
  }

  const tallest = Math.max(...lines.map((l) => l.bbox.y1 - l.bbox.y0));
  const blocks: PosterBlock[] = lines.slice(0, 16).map((line, i): PosterBlock => {
    const boxH = line.bbox.y1 - line.bbox.y0;
    const text = line.text.trim();
    const label = boxH === tallest ? "Headline" : DATE_PATTERN.test(text) ? "Date or time" : `Text line ${i + 1}`;
    return {
      id: `scan-${i}`,
      label,
      role: boxH === tallest ? "title" : "body",
      text,
      x: (line.bbox.x0 / W) * 100,
      y: (line.bbox.y0 / H) * 100,
      w: ((line.bbox.x1 - line.bbox.x0) / W) * 100,
      h: (boxH / H) * 100,
      capHeightPct: (boxH / H) * 100 * CAP_OF_LINE_BOX,
      weight: 400,
      align: "left",
      tone: "ink",
      contrast: measureContrast(ctx, line.bbox, false),
      deutanContrast: measureContrast(ctx, line.bbox, true),
    };
  });

  onProgress({ stage: "Done", progress: 1 });
  return {
    id: "uploaded",
    title: file.name.replace(/\.[a-z0-9]+$/i, ""),
    kind: "Club event",
    owner: "Your upload (stays in this browser)",
    hangingSpot: "Wherever you hang it",
    intendedSize: "A2",
    intendedDistanceM: 4,
    background: "ground",
    updated: new Date().toISOString().slice(0, 10),
    blocks,
    imageUrl: url,
    aspect: W / H,
  };
}
