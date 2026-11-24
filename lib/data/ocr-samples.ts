// SAMPLE numbers, not measured. These are hand-written example OCR results for the 4 seed
// posters, so the fake adapter can show what the 8-distance confirmation looks like before
// a visitor uploads anything. The UI labels them "Sample OCR". Live OCR results only come
// from lib/ocr.ts running Tesseract.js on an upload in the browser.
//
// Rules for the table: every distance is 0 or on the SCAN_DISTANCES_M grid, never above the
// block's model distance (20/20 vision, the poster's intended size), and each value sits a
// step or two under the model because a machine reader gives up earlier than a person.
// Kept out of lib/data/seed.ts so `npm run seed` output does not change.

import { SCAN_DISTANCES_M } from "../legibility";
import { OcrSamplesSchema } from "../schemas";
import type { BlockOcr, PaperSize } from "../types";

/** Sample word-match ratios: high while the line passes, falling off after it fails. */
function sampleRatios(maxDistanceM: number): number[] {
  const firstFail = SCAN_DISTANCES_M.findIndex((d) => d > maxDistanceM);
  return SCAN_DISTANCES_M.map((_, i) => {
    if (firstFail === -1 || i < firstFail) return Math.round((1 - 0.04 * i) * 100) / 100;
    return Math.round(Math.max(0, 0.45 - 0.15 * (i - firstFail)) * 100) / 100;
  });
}

function sample(size: PaperSize, maxDistanceM: number): BlockOcr {
  return { maxDistanceM, matchByDistance: sampleRatios(maxDistanceM), size, profileId: "2020", basis: "sample" };
}

// Model distance (20/20) in the comment after each line, for review.
const RAW: Record<string, BlockOcr> = {
  // Robot Sumo Night, A2
  "rs-title": sample("A2", 7), // model 9.0 m
  "rs-date": sample("A2", 2), // model 2.4 m, the demo narration
  "rs-venue": sample("A2", 1.5), // model 1.7 m
  "rs-body": sample("A2", 1.5), // model 1.5 m
  "rs-qr": sample("A2", 1), // model 1.1 m
  // Microplastics in Campus Tap Water, A1
  "mp-title": sample("A1", 7), // model 8.7 m
  "mp-results": sample("A1", 4), // model 5.2 m
  "mp-method": sample("A1", 1.5), // model 1.8 m
  "mp-axis": sample("A1", 1), // model 1.2 m
  "mp-byline": sample("A1", 2), // model 2.1 m
  // Sleep Debt and Exam Recall, A0
  "sd-band": sample("A0", 5), // model 6.7 m
  "sd-authors": sample("A0", 3), // model 3.6 m
  "sd-finding": sample("A0", 5), // model 5.6 m
  "sd-abstract": sample("A0", 1.5), // model 1.9 m
  "sd-fig": sample("A0", 0), // model 66 cm
  // Silent Film Night, A3
  "sf-title": sample("A3", 5), // model 6.2 m
  "sf-sub": sample("A3", 2), // model 2.3 m
  "sf-date": sample("A3", 1.5), // model 1.8 m
  "sf-price": sample("A3", 0), // model 44 cm
};

export const OCR_SAMPLES: Record<string, BlockOcr> = OcrSamplesSchema.parse(RAW);
