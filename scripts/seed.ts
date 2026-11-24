// npm run seed: writes the seed as a JSON snapshot to fixtures/seed-snapshot.json.
// No clock, no randomness: two runs produce identical bytes.
// This is a build-time script; app code never writes to the file system.
// scripts/demo-reset.ts imports writeSeedSnapshot from here.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAPER_SIZES, POSTERS, TONE_VAR, VISION_PROFILES } from "../lib/data/seed";

export const SNAPSHOT_RELATIVE_PATH = "fixtures/seed-snapshot.json";

/** The snapshot text, exactly as it is written to disk. */
export function seedSnapshotText(): string {
  const snapshot = {
    posters: POSTERS,
    visionProfiles: VISION_PROFILES,
    paperSizes: PAPER_SIZES,
    toneVar: TONE_VAR,
  };
  return JSON.stringify(snapshot, null, 2) + "\n";
}

/** Writes fixtures/seed-snapshot.json and returns its absolute path and the bytes written. */
export function writeSeedSnapshot(root: string = process.cwd()): { file: string; bytes: Buffer } {
  const dir = join(root, "fixtures");
  mkdirSync(dir, { recursive: true });
  const file = join(root, SNAPSHOT_RELATIVE_PATH);
  const bytes = Buffer.from(seedSnapshotText(), "utf8");
  writeFileSync(file, bytes);
  return { file, bytes };
}

export function seedSummary(): string {
  const blockCount = POSTERS.reduce((n, p) => n + p.blocks.length, 0);
  return `seed: wrote ${POSTERS.length} posters, ${blockCount} blocks, ${VISION_PROFILES.length} profiles to ${SNAPSHOT_RELATIVE_PATH}`;
}

// Run only when called as `tsx scripts/seed.ts`, not when imported by demo-reset.
if (/seed\.ts$/.test(process.argv[1] ?? "")) {
  writeSeedSnapshot();
  console.log(seedSummary());
}
