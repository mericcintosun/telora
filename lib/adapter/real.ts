// Real adapter, honestly: there is no poster backend. Real scanning happens in the
// visitor's browser (lib/ocr.ts, Tesseract.js), and uploaded posters never reach a server.
// So this adapter reads the same seed as the fake one. It exists so the interface is
// exercised under ADAPTER_MODE=real, and it is the Phase 2 swap point if example posters
// or OCR confirmation results ever come from somewhere other than lib/data/seed.ts.

import { POSTERS, VISION_PROFILES } from "@/lib/data/seed";
import type { PosterAdapter } from "./types";

export const realAdapter: PosterAdapter = {
  mode: "real",
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
