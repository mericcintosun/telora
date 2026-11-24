// Picks the data source for pages and API routes. Server-side only (reads process.env).
// ADAPTER_MODE=real selects lib/adapter/real.ts; anything else, or unset, selects "fake".

import { fakeAdapter } from "./fake";
import { realAdapter } from "./real";
import type { PosterAdapter } from "./types";

export type { PosterAdapter } from "./types";

export function getAdapter(): PosterAdapter {
  const mode = process.env.ADAPTER_MODE === "real" ? "real" : "fake";
  return mode === "real" ? realAdapter : fakeAdapter;
}
