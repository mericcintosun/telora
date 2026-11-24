// npm run demo:reset: puts the demo back to a known state before a recording.
//
// Telora has no server store and no chain. The whole system state is the seed constants
// (lib/data/seed.ts), the URL search params and the tab's in-memory scan cache, so a page
// reload resets the tab. This script only rewrites fixtures/seed-snapshot.json through the
// same writer as `npm run seed`, twice, and checks that both runs give identical bytes.
// It exits non-zero when they differ. It never runs inside the app.

import { readFileSync } from "node:fs";
import { SNAPSHOT_RELATIVE_PATH, seedSummary, writeSeedSnapshot } from "./seed";

const DEMO_PATH = "/?poster=robot-sumo-night&size=A2&d=4.0&profile=2020";

function main(): number {
  const first = writeSeedSnapshot();
  const firstOnDisk = readFileSync(first.file);
  const second = writeSeedSnapshot();
  const secondOnDisk = readFileSync(second.file);

  if (!first.bytes.equals(second.bytes) || !firstOnDisk.equals(secondOnDisk) || !firstOnDisk.equals(first.bytes)) {
    console.error(`demo:reset: ${SNAPSHOT_RELATIVE_PATH} differs between two runs, the seed is not deterministic`);
    return 1;
  }

  console.log(seedSummary());
  console.log(`demo:reset: two runs wrote identical bytes (${firstOnDisk.length} bytes)`);
  console.log("demo:reset: no server store and no chain to reset; reload the tab to clear the scan cache");
  console.log(`demo:reset: clean demo URL ${DEMO_PATH}`);
  return 0;
}

try {
  process.exitCode = main();
} catch {
  console.error("demo:reset: could not write the snapshot");
  process.exitCode = 1;
}
