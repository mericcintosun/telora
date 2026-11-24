// In-memory cache for scan results, keyed by the SHA-256 of the file bytes plus paper size
// and vision profile. Module scope only: it lives as long as the tab, writes nothing to disk,
// localStorage or a server. The same file, size and profile render identically and instantly
// the second time.

import type { PaperSize, PosterBlock, VisionProfile } from "./types";

export type BlurMode = "filter" | "downscale";

export interface CachedScan {
  /** Blocks with their per-block `ocr` results attached. */
  blocks: PosterBlock[];
  aspect: number;
  blurMode: BlurMode;
}

const store = new Map<string, CachedScan>();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Content-hash key, or null when crypto.subtle is unavailable (insecure context): no caching then. */
export async function scanCacheKey(file: Blob, size: PaperSize, profileId: VisionProfile["id"]): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const digest = await subtle.digest("SHA-256", await file.arrayBuffer());
  return `${toHex(digest)}:${size}:${profileId}`;
}

export function getCachedScan(key: string | null): CachedScan | null {
  if (!key) return null;
  const hit = store.get(key);
  // Hand out copies so a caller cannot mutate the cached blocks.
  return hit ? { ...hit, blocks: hit.blocks.map((b) => ({ ...b })) } : null;
}

export function setCachedScan(key: string | null, value: CachedScan): void {
  if (!key) return;
  store.set(key, { ...value, blocks: value.blocks.map((b) => ({ ...b })) });
}
