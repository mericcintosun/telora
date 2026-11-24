// Pure logic for the 8-distance OCR confirmation: no DOM, no Tesseract, no network.
// lib/ocr.ts feeds it the words Tesseract finds on each blurred copy; tests feed it fixed inputs.

import { OCR_AGREE_RATIO, OCR_BLOCK_PAD_PCT } from "./config";
import { MIN_DISTANCE_M, formatMeters } from "./legibility";
import type { BlockOcr, PosterBlock } from "./types";

/** A recognized word with its box in percent of the poster width (x) and height (y). */
export interface PctWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The parts of a block the word assignment needs. */
export type BlockBox = Pick<PosterBlock, "id" | "x" | "y" | "w" | "h" | "capHeightPct">;

/** Lowercase, strip punctuation, split on whitespace, drop empties. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Share of the expected words found, counted as a multiset (a word expected twice must be
 * found twice). The expected count is the denominator; an empty expected list gives 0.
 */
export function wordMatchRatio(expected: string[], found: string[]): number {
  if (expected.length === 0) return 0;
  const pool = new Map<string, number>();
  for (const w of found) pool.set(w, (pool.get(w) ?? 0) + 1);
  let hits = 0;
  for (const w of expected) {
    const n = pool.get(w) ?? 0;
    if (n > 0) {
      hits += 1;
      pool.set(w, n - 1);
    }
  }
  return hits / expected.length;
}

/** Seed blocks leave `h` empty; a line box is roughly 1.6 cap heights tall. */
function blockHeightPct(b: BlockBox): number {
  return b.h ?? b.capHeightPct * 1.6;
}

/**
 * Groups words by block: a word belongs to the first block whose box (padded by
 * OCR_BLOCK_PAD_PCT) contains the word box center. Returns normalized words per block id;
 * every block id is present, words outside every block are dropped.
 */
export function assignWordsToBlocks(words: PctWord[], blocks: BlockBox[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const b of blocks) out[b.id] = [];
  for (const word of words) {
    const cx = (word.x0 + word.x1) / 2;
    const cy = (word.y0 + word.y1) / 2;
    const hit = blocks.find(
      (b) =>
        cx >= b.x - OCR_BLOCK_PAD_PCT &&
        cx <= b.x + b.w + OCR_BLOCK_PAD_PCT &&
        cy >= b.y - OCR_BLOCK_PAD_PCT &&
        cy <= b.y + blockHeightPct(b) + OCR_BLOCK_PAD_PCT
    );
    if (hit) out[hit.id].push(...normalizeWords(word.text));
  }
  return out;
}

/**
 * The largest distance such that every distance up to it passes (ratio >= passRatio).
 * Returns 0 when the first distance (1 m) already fails.
 */
export function ocrMaxDistanceM(ratios: number[], distances: number[], passRatio: number): number {
  let max = 0;
  for (let i = 0; i < distances.length; i++) {
    if ((ratios[i] ?? 0) < passRatio) break;
    max = distances[i];
  }
  return max;
}

/** True when the OCR distance backs the model: at least OCR_AGREE_RATIO of it, or both under 1 m. */
export function ocrAgrees(ocrMaxM: number, modelMaxM: number): boolean {
  if (ocrMaxM === 0 && modelMaxM < MIN_DISTANCE_M) return true;
  return ocrMaxM >= modelMaxM * OCR_AGREE_RATIO;
}

/** "OCR: 2.0 m, model: 2.4 m". Sample results read "Sample OCR". Null when the block has no OCR. */
export function confirmationLine(block: { ocr?: BlockOcr }, modelMaxM: number): string | null {
  const ocr = block.ocr;
  if (!ocr) return null;
  const label = ocr.basis === "sample" ? "Sample OCR" : "OCR";
  const ocrText = ocr.maxDistanceM === 0 ? "under 1 m" : formatMeters(ocr.maxDistanceM);
  return `${label}: ${ocrText}, model: ${formatMeters(modelMaxM)}`;
}
