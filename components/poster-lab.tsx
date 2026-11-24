"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BlockReport } from "@/components/block-report";
import { PosterDeck } from "@/components/poster-deck";
import { SimulatedPoster, type BlockScore } from "@/components/simulated-poster";
import { UploadScan } from "@/components/upload-scan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  PAPER_SIZES,
  POSTERS,
  VISION_PROFILES,
  findPoster,
  findProfile,
  type PaperSize,
  type PosterRecord,
  type VisionProfile,
} from "@/lib/data";
import { MAX_DISTANCE_M, MIN_DISTANCE_M, maxReadableDistanceM, verdictAt } from "@/lib/legibility";

export interface LabState {
  posterId: string;
  size: PaperSize;
  distanceM: number;
  profileId: VisionProfile["id"];
}

/** The whole tool: poster rail, simulated view, controls and per-block report. */
export function PosterLab({ initial }: { initial: LabState }) {
  const [posterId, setPosterId] = useState(initial.posterId);
  const [upload, setUpload] = useState<PosterRecord | null>(null);
  const [size, setSize] = useState<PaperSize>(initial.size);
  const [distanceM, setDistanceM] = useState(initial.distanceM);
  const [profileId, setProfileId] = useState<VisionProfile["id"]>(initial.profileId);
  const [showVerdicts, setShowVerdicts] = useState(true);

  const poster = upload ?? findPoster(posterId);
  const profile = findProfile(profileId);

  const scores = useMemo(() => {
    const out: Record<string, BlockScore> = {};
    for (const b of poster.blocks) {
      const maxDistanceM = maxReadableDistanceM(b, size, profile);
      out[b.id] = { maxDistanceM, verdict: verdictAt(maxDistanceM, distanceM) };
    }
    return out;
  }, [poster, size, profile, distanceM]);

  const lostCount = Object.values(scores).filter((s) => s.verdict === "lost").length;

  // Shareable state: every setting lives in the URL, so a result has a link.
  useEffect(() => {
    const params = new URLSearchParams();
    if (!upload) params.set("poster", posterId);
    params.set("size", size);
    params.set("d", distanceM.toFixed(1));
    params.set("profile", profileId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [posterId, upload, size, distanceM, profileId]);

  function selectPoster(id: string) {
    const next = findPoster(id);
    setUpload(null);
    setPosterId(id);
    setSize(next.intendedSize);
    setDistanceM(next.intendedDistanceM);
  }

  return (
    <section id="lab" aria-label="Poster legibility lab" className="flex flex-col gap-4">
      <PosterDeck posters={POSTERS} activeId={upload ? "" : posterId} onSelect={selectPoster} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="flex flex-col overflow-hidden bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <p className="text-sm" aria-live="polite">
              <strong>{poster.title}</strong> on {size} at {distanceM.toFixed(1)} m, {profile.label}:{" "}
              {lostCount === 0 ? (
                <span className="font-semibold text-ok">every block reads</span>
              ) : (
                <span className="font-semibold text-bad">
                  {lostCount} of {poster.blocks.length} blocks lost
                </span>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowVerdicts((v) => !v)} aria-pressed={showVerdicts}>
              {showVerdicts ? <EyeOff /> : <Eye />}
              {showVerdicts ? "Hide verdicts" : "Show verdicts"}
            </Button>
          </div>
          <div className="flex h-[min(66vh,660px)] min-h-[440px] items-center justify-center p-6 pt-9">
            <SimulatedPoster
              poster={poster}
              size={size}
              distanceM={distanceM}
              profile={profile}
              scores={scores}
              showVerdicts={showVerdicts}
            />
          </div>
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Hangs at: {poster.hangingSpot}. Owner: {poster.owner}. Last edited {poster.updated}.
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Where it hangs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold" id="size-label">
                  Print size
                </span>
                <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="size-label">
                  {PAPER_SIZES.map((s) => (
                    <Button key={s} variant="choice" aria-pressed={size === s} onClick={() => setSize(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="distance" className="flex items-baseline justify-between text-sm font-semibold">
                  Viewing distance
                  <span className="font-display text-2xl font-black text-magenta">{distanceM.toFixed(1)} m</span>
                </label>
                <Slider
                  id="distance"
                  min={MIN_DISTANCE_M}
                  max={MAX_DISTANCE_M}
                  step={0.1}
                  value={distanceM}
                  onChange={(e) => setDistanceM(Number(e.target.value))}
                  aria-valuetext={`${distanceM.toFixed(1)} metres`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 m, reading up close</span>
                  <span>10 m, across the hall</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold" id="profile-label">
                  Who is looking
                </span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="profile-label">
                  {VISION_PROFILES.map((p) => (
                    <Button
                      key={p.id}
                      variant="choice"
                      aria-pressed={profileId === p.id}
                      onClick={() => setProfileId(p.id)}
                      title={p.note}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{profile.note}.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Block by block</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockReport poster={poster} size={size} distanceM={distanceM} profile={profile} scores={scores} />
            </CardContent>
          </Card>

          <UploadScan
            onScanned={(p) => {
              setUpload(p);
              setSize(p.intendedSize);
              setDistanceM(p.intendedDistanceM);
            }}
            onReset={() => setUpload(null)}
          />
        </div>
      </div>
    </section>
  );
}
