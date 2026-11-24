import type { AdapterMode, PosterRecord, VisionProfile } from "@/lib/types";

/** The one seam between Telora's pages and API routes and wherever posters come from. */
export interface PosterAdapter {
  readonly mode: AdapterMode;
  listPosters(): Promise<PosterRecord[]>;
  /** Resolves to null when no poster has this id. */
  getPoster(id: string): Promise<PosterRecord | null>;
  listProfiles(): Promise<VisionProfile[]>;
  /** Resolves to null when no profile has this id. */
  getProfile(id: string): Promise<VisionProfile | null>;
}
