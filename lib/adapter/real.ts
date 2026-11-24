// Real adapter, honestly: there is no poster backend and no hosted model. The real OCR runs
// in the visitor's browser (lib/ocr.ts, Tesseract.js) on uploads, and uploaded posters never
// reach a server. So this adapter serves the seed posters with no `ocr` field: it never
// invents OCR numbers. ADAPTER_MODE=real only decides whether seed posters show sample OCR
// numbers (fake) or none (real); the upload path is live in both modes.

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
