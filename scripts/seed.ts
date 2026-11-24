// npm run seed: writes the seed as a JSON snapshot to fixtures/seed-snapshot.json.
// No clock, no randomness: two runs produce identical bytes.
// This is a build-time script; app code never writes to the file system.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAPER_SIZES, POSTERS, TONE_VAR, VISION_PROFILES } from "../lib/data/seed";

const snapshot = {
  posters: POSTERS,
  visionProfiles: VISION_PROFILES,
  paperSizes: PAPER_SIZES,
  toneVar: TONE_VAR,
};

const dir = join(process.cwd(), "fixtures");
mkdirSync(dir, { recursive: true });
const file = join(dir, "seed-snapshot.json");
writeFileSync(file, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

const blockCount = POSTERS.reduce((n, p) => n + p.blocks.length, 0);
console.log(`seed: wrote ${POSTERS.length} posters, ${blockCount} blocks, ${VISION_PROFILES.length} profiles to fixtures/seed-snapshot.json`);
