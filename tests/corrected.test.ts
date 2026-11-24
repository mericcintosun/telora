// npm test: the corrected Robot Sumo Night poster (DEMO.md step 6) reads at 4 m.
// Runs with node:test through tsx; pure lib/legibility.ts math, no browser.
//
// Only the 2020 profile is asserted. Under 20/40 the threshold doubles, so every lost line
// would need a cap height near 3.2% of the poster height on A2 (the date alone would run
// wider than the sheet at that size). The corrected poster cannot hold 20/40 at 4 m without
// overlap, so the 20/40 case is documented here and in HANDOFF.md instead of asserted.

import { test } from "node:test";
import assert from "node:assert/strict";
import { POSTERS, VISION_PROFILES } from "../lib/data/seed";
import { maxReadableDistanceM, verdictAt } from "../lib/legibility";

const fixed = POSTERS.find((p) => p.id === "robot-sumo-night-fixed");
const original = POSTERS.find((p) => p.id === "robot-sumo-night");
const p2020 = VISION_PROFILES.find((p) => p.id === "2020");

test("corrected poster exists and links both ways", () => {
  assert.ok(fixed, "robot-sumo-night-fixed is in the seed");
  assert.ok(original, "robot-sumo-night is in the seed");
  assert.equal(fixed.fixOf, original.id);
  assert.equal(original.correctedId, fixed.id);
  assert.equal(fixed.blocks.length, original.blocks.length);
  for (const b of fixed.blocks) assert.ok(b.id.startsWith("rsf-"), b.id);
});

test("every block of the corrected poster reads at 4 m or more for 20/20 on A2", () => {
  assert.ok(fixed && p2020);
  for (const b of fixed.blocks) {
    const m = maxReadableDistanceM(b, fixed.intendedSize, p2020);
    assert.ok(m >= 4, `${b.id} reads only to ${m.toFixed(2)} m`);
  }
});

test("every block of the corrected poster is green (legible, not borderline) at 4 m", () => {
  assert.ok(fixed && p2020);
  for (const b of fixed.blocks) {
    const m = maxReadableDistanceM(b, fixed.intendedSize, p2020);
    assert.equal(verdictAt(m, 4), "legible", `${b.id} at ${m.toFixed(2)} m max`);
  }
});

test("the original date still needs about 1.7x at 4 m", () => {
  assert.ok(original && p2020);
  const date = original.blocks.find((b) => b.id === "rs-date");
  assert.ok(date);
  const factor = 4 / maxReadableDistanceM(date, original.intendedSize, p2020);
  assert.equal(factor.toFixed(1), "1.7");
});
