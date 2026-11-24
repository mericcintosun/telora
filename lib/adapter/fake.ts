// Fake adapter: serves the deterministic seed in lib/data/seed.ts with SAMPLE OCR results
// from lib/data/ocr-samples.ts attached to each block (basis "sample", labelled in the UI).

import { OCR_SAMPLES } from "@/lib/data/ocr-samples";
import { POSTERS, VISION_PROFILES } from "@/lib/data/seed";
import type { PosterRecord } from "@/lib/types";
import type { PosterAdapter } from "./types";

function withSampleOcr(poster: PosterRecord): PosterRecord {
  return {
    ...poster,
    blocks: poster.blocks.map((b) => (OCR_SAMPLES[b.id] ? { ...b, ocr: OCR_SAMPLES[b.id] } : b)),
  };
}

const SAMPLE_POSTERS: PosterRecord[] = POSTERS.map(withSampleOcr);

export const fakeAdapter: PosterAdapter = {
  mode: "fake",
  async listPosters() {
    return SAMPLE_POSTERS;
  },
  async getPoster(id) {
    return SAMPLE_POSTERS.find((p) => p.id === id) ?? null;
  },
  async listProfiles() {
    return VISION_PROFILES;
  },
  async getProfile(id) {
    return VISION_PROFILES.find((p) => p.id === id) ?? null;
  },
};
