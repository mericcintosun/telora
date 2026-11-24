// Fake adapter: serves the deterministic seed in lib/data/seed.ts.

import { POSTERS, VISION_PROFILES } from "@/lib/data/seed";
import type { PosterAdapter } from "./types";

export const fakeAdapter: PosterAdapter = {
  mode: "fake",
  async listPosters() {
    return POSTERS;
  },
  async getPoster(id) {
    return POSTERS.find((p) => p.id === id) ?? null;
  },
  async listProfiles() {
    return VISION_PROFILES;
  },
  async getProfile(id) {
    return VISION_PROFILES.find((p) => p.id === id) ?? null;
  },
};
