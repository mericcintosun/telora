"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BlockReport } from "@/components/block-report";
import { LabEmptyState } from "@/components/lab-states";
import { PosterDeck } from "@/components/poster-deck";
import { SimulatedPoster, type BlockScore } from "@/components/simulated-poster";
import { UploadScan } from "@/components/upload-scan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { PAPER_SIZES, type AdapterMode, type PaperSize, type PosterRecord, type VisionProfile } from "@/lib/data";
import { MAX_DISTANCE_M, MIN_DISTANCE_M, maxReadableDistanceM, verdictAt } from "@/lib/legibility";

export interface LabState {
  posterId: string;
  size: PaperSize;
  distanceM: number;
  profileId: VisionProfile["id"];
}

/**
 * The whole tool: poster rail, simulated view, controls and per-block report.
 * Posters and profiles arrive as props from app/page.tsx, which reads them through
 * the adapter seam (lib/adapter). This component never imports the seed.
 * `mode` is the adapter mode, so the report can say whether its OCR numbers are samples.
 */
const SOURCE_LINE: Record<AdapterMode, string> = {
  fake: "Sample data: the example posters carry sample OCR numbers. Upload your own poster for a live OCR check.",
  real: "Live: your upload is read by Tesseract.js in this browser at 8 distances.",
};

export function PosterLab({
  initial,
  posters,
  profiles,
  mode,
}: {
  initial: LabState;
  posters: PosterRecord[];
  profiles: VisionProfile[];
  mode: AdapterMode;
}) {
  const [posterId, setPosterId] = useState(initial.posterId);
  const [upload, setUpload] = useState<PosterRecord | null>(null);
  const [size, setSize] = useState<PaperSize>(initial.size);
  const [distanceM, setDistanceM] = useState(initial.distanceM);
  const [profileId, setProfileId] = useState<VisionProfile["id"]>(initial.profileId);
  const [showVerdicts, setShowVerdicts] = useState(true);

  const poster: PosterRecord | undefined = upload ?? posters.find((p) => p.id === posterId) ?? posters[0];
  const profile: VisionProfile = profiles.find((p) => p.id === profileId) ?? profiles[0];
  const baseline: VisionProfile = profiles.find((p) => p.id === "2020") ?? profiles[0];

  const scores = useMemo(() => {
    const out: Record<string, BlockScore> = {};
    if (!poster || !profile) return out;
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
    if (!upload && posterId) params.set("poster", posterId);
    params.set("size", size);
    params.set("d", distanceM.toFixed(1));
    params.set("profile", profileId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [posterId, upload, size, distanceM, profileId]);

  function selectPoster(id: string) {
    const next = posters.find((p) => p.id === id);
    if (!next) return;
    setUpload(null);
    setPosterId(id);
    setSize(next.intendedSize);
    setDistanceM(next.intendedDistanceM);
  }

  const uploadCard = (
    <UploadScan
      size={size}
      profile={profile}
      onScanned={(p) => {
        setUpload(p);
        setSize(p.intendedSize);
        setDistanceM(p.intendedDistanceM);
      }}
      onReset={() => setUpload(null)}
    />
  );

  return (
    <section id="lab" aria-label="Poster legibility lab" className="flex flex-col gap-4">
      {posters.length > 0 && baseline && (
        <PosterDeck posters={posters} activeId={upload ? "" : posterId} onSelect={selectPoster} profile={baseline} />
      )}

      {/* Empty state: no seed posters (posters.length === 0) and nothing uploaded yet. */}
      {!poster || !profile ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <LabEmptyState />
          {uploadCard}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <Card className="flex flex-col overflow-hidden bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
              <p className="text-sm" aria-live="polite">
                <strong>{poster.title}</strong> on {size} at {distanceM.toFixed(1)} m, {profile.label}:{" "}
                {poster.blocks.length === 0 ? (
                  <span className="font-semibold text-muted-foreground">no text lines to score</span>
                ) : lostCount === 0 ? (
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
            <div className="flex h-[min(66vh,41rem)] min-h-[27.5rem] items-center justify-center p-6 pt-9">
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
                    {profiles.map((p) => (
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
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">{SOURCE_LINE[mode]}</p>
                <BlockReport
                  poster={poster}
                  size={size}
                  distanceM={distanceM}
                  profile={profile}
                  scores={scores}
                  onOpenPoster={upload ? undefined : selectPoster}
                />
              </CardContent>
            </Card>

            {uploadCard}
          </div>
        </div>
      )}
    </section>
  );
}
