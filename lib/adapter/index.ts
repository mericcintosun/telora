// Picks the data source for pages and API routes. Server-side only (reads process.env).
// This is the only reader of ADAPTER_MODE. "real" selects lib/adapter/real.ts (seed posters,
// no OCR numbers); anything else, or unset, selects "fake" (seed posters with sample OCR).
//
// getLabData() is the documented fallback for DEMO.md steps 1 to 5: active adapter first,
// then the fake adapter, then the seed constants, so `/` never renders empty.

import { POSTERS, VISION_PROFILES } from "@/lib/data/seed";
import type { AdapterMode, PosterRecord, VisionProfile } from "@/lib/types";
import { fakeAdapter } from "./fake";
import { realAdapter } from "./real";
import type { PosterAdapter } from "./types";

export type { PosterAdapter } from "./types";

export function getAdapter(): PosterAdapter {
  const mode = process.env.ADAPTER_MODE === "real" ? "real" : "fake";
  return mode === "real" ? realAdapter : fakeAdapter;
}

export interface LabData {
  posters: PosterRecord[];
  profiles: VisionProfile[];
  mode: AdapterMode;
  /** True when the active adapter threw or returned an empty list and a fallback served the data. */
  usedFallback: boolean;
}

async function readFrom(adapter: PosterAdapter): Promise<{ posters: PosterRecord[]; profiles: VisionProfile[] } | null> {
  try {
    const [posters, profiles] = await Promise.all([adapter.listPosters(), adapter.listProfiles()]);
    if (posters.length === 0 || profiles.length === 0) return null;
    return { posters, profiles };
  } catch {
    return null;
  }
}

/** Posters and profiles for the lab: active adapter, then fake adapter, then the seed constants. */
export async function getLabData(): Promise<LabData> {
  const adapter = getAdapter();
  const primary = await readFrom(adapter);
  if (primary) return { ...primary, mode: adapter.mode, usedFallback: false };

  if (adapter !== fakeAdapter) {
    const fake = await readFrom(fakeAdapter);
    if (fake) return { ...fake, mode: fakeAdapter.mode, usedFallback: true };
  }

  // Last resort: the seed constants, with no OCR numbers attached.
  return { posters: POSTERS, profiles: VISION_PROFILES, mode: "real", usedFallback: true };
}
