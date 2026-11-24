// npm test: pure checks for lib/confirm.ts, lib/schemas.ts and the sample OCR table.
// Runs with node:test through tsx; no browser, no Tesseract.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignWordsToBlocks,
  confirmationLine,
  normalizeWords,
  ocrAgrees,
  ocrMaxDistanceM,
  wordMatchRatio,
} from "../lib/confirm";
import { OCR_PASS_RATIO } from "../lib/config";
import { SCAN_DISTANCES_M } from "../lib/legibility";
import { BlockOcrSchema, UploadFileSchema } from "../lib/schemas";
import { OCR_SAMPLES } from "../lib/data/ocr-samples";
import { POSTERS } from "../lib/data/seed";
import type { BlockOcr } from "../lib/types";

const D = SCAN_DISTANCES_M;

test("1. exact match scores 1", () => {
  const expected = normalizeWords("Thursday 3 December, 18:30");
  assert.deepEqual(expected, ["thursday", "3", "december", "18", "30"]);
  assert.equal(wordMatchRatio(expected, normalizeWords("THURSDAY 3 December 18:30")), 1);
});

test("2. partial match at the 0.6 boundary passes", () => {
  const expected = ["robot", "sumo", "night", "lab", "z"];
  const ratio = wordMatchRatio(expected, ["robot", "sumo", "night", "1ab"]);
  assert.equal(ratio, 0.6);
  assert.ok(ratio >= OCR_PASS_RATIO);
  // A repeated word must be found as many times as it is expected.
  assert.equal(wordMatchRatio(["go", "go"], ["go"]), 0.5);
});

test("3. empty expected list gives 0", () => {
  assert.equal(wordMatchRatio([], ["anything"]), 0);
  assert.equal(wordMatchRatio([], []), 0);
});

test("4. block lost at 1 m gives 0", () => {
  const ratios = [0.4, 0.2, 0, 0, 0, 0, 0, 0];
  assert.equal(ocrMaxDistanceM(ratios, D, OCR_PASS_RATIO), 0);
});

test("5. block that passes at every distance gives 10", () => {
  const ratios = [1, 1, 1, 0.9, 0.9, 0.8, 0.7, 0.6];
  assert.equal(ocrMaxDistanceM(ratios, D, OCR_PASS_RATIO), 10);
});

test("a later pass after a failure does not count", () => {
  const ratios = [1, 1, 0.5, 1, 1, 0, 0, 0];
  assert.equal(ocrMaxDistanceM(ratios, D, OCR_PASS_RATIO), 1.5);
});

test("words are assigned by box center", () => {
  const blocks = [
    { id: "a", x: 10, y: 10, w: 50, h: 5, capHeightPct: 3 },
    { id: "b", x: 10, y: 40, w: 50, h: 5, capHeightPct: 3 },
  ];
  const words = [
    { text: "Robot", x0: 11, y0: 11, x1: 20, y1: 14 },
    { text: "Night!", x0: 30, y0: 41, x1: 40, y1: 44 },
    { text: "stray", x0: 80, y0: 80, x1: 90, y1: 85 },
  ];
  assert.deepEqual(assignWordsToBlocks(words, blocks), { a: ["robot"], b: ["night"] });
});

function ocr(maxDistanceM: number, basis: BlockOcr["basis"] = "live"): BlockOcr {
  return { maxDistanceM, matchByDistance: [1, 1, 1, 0, 0, 0, 0, 0], size: "A2", profileId: "2020", basis };
}

test("confirmationLine wording", () => {
  assert.equal(confirmationLine({ ocr: ocr(2) }, 2.4), "OCR: 2.0 m, model: 2.4 m");
  assert.equal(confirmationLine({ ocr: ocr(0) }, 0.66), "OCR: under 1 m, model: 66 cm");
  assert.equal(confirmationLine({ ocr: ocr(10) }, 12), "OCR: 10+ m, model: 10+ m");
  assert.equal(confirmationLine({ ocr: ocr(2, "sample") }, 2.4), "Sample OCR: 2.0 m, model: 2.4 m");
  assert.equal(confirmationLine({}, 2.4), null);
});

test("ocrAgrees uses the 85% rule", () => {
  assert.equal(ocrAgrees(2, 2.4), false);
  assert.equal(ocrAgrees(2, 2.3), true);
  assert.equal(ocrAgrees(0, 0.66), true);
});

test("BlockOcrSchema accepts a valid result and rejects an invalid one", () => {
  assert.equal(BlockOcrSchema.safeParse(ocr(2)).success, true);
  assert.equal(BlockOcrSchema.safeParse({ ...ocr(2), maxDistanceM: 2.4 }).success, false);
  assert.equal(BlockOcrSchema.safeParse({ ...ocr(2), matchByDistance: [1, 1] }).success, false);
});

test("UploadFileSchema accepts a PNG and rejects a PDF", () => {
  assert.equal(UploadFileSchema.safeParse({ type: "image/png", size: 200_000 }).success, true);
  assert.equal(UploadFileSchema.safeParse({ type: "application/pdf", size: 200_000 }).success, false);
});

test("sample OCR table covers every seed block and stays consistent", () => {
  const ids = POSTERS.flatMap((p) => p.blocks.map((b) => b.id));
  assert.equal(POSTERS.length, 4);
  assert.equal(ids.length, 19);
  for (const id of ids) {
    const s = OCR_SAMPLES[id];
    assert.ok(s, `missing sample for ${id}`);
    assert.equal(s.basis, "sample");
    assert.equal(ocrMaxDistanceM(s.matchByDistance, D, OCR_PASS_RATIO), s.maxDistanceM, id);
  }
});
