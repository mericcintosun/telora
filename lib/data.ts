// Barrel kept so every existing `@/lib/data` import keeps resolving.
// Types live in lib/types.ts, the seed in lib/data/seed.ts. Pages and API routes read
// posters and profiles through the adapter in lib/adapter; this barrel serves types,
// PAPER_SIZES, TONE_VAR and the lookup helpers.

import { POSTERS, VISION_PROFILES } from "./data/seed";
import type { PosterRecord, VisionProfile } from "./types";

export * from "./types";
export { PAPER_SIZES, POSTERS, TONE_VAR, VISION_PROFILES } from "./data/seed";

/** Finds a poster by id in `list` (the seed by default), falling back to the first one. */
export function findPoster(id: string | undefined, list: PosterRecord[] = POSTERS): PosterRecord {
  return list.find((p) => p.id === id) ?? list[0];
}

/** Finds a vision profile by id in `list` (the seed by default), falling back to 20/20. */
export function findProfile(id: string | undefined, list: VisionProfile[] = VISION_PROFILES): VisionProfile {
  return list.find((p) => p.id === id) ?? list[0];
}
