// Picks the data source for pages and API routes. Server-side only (reads process.env).
// This is the only reader of ADAPTER_MODE. "real" selects lib/adapter/real.ts (seed posters,
// no OCR numbers); anything else, or unset, selects "fake" (seed posters with sample OCR).

import { fakeAdapter } from "./fake";
import { realAdapter } from "./real";
import type { PosterAdapter } from "./types";

export type { PosterAdapter } from "./types";

export function getAdapter(): PosterAdapter {
  const mode = process.env.ADAPTER_MODE === "real" ? "real" : "fake";
  return mode === "real" ? realAdapter : fakeAdapter;
}
