"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff } from "lucide-react";
import { BlockReport } from "@/components/block-report";
import { CorridorView } from "@/components/corridor-view";
import { Entrance } from "@/components/entrance";
import { LabEmptyState } from "@/components/lab-states";
import { LinesGauge } from "@/components/lines-gauge";
import { PosterDeck } from "@/components/poster-deck";
import { SimulatedPoster, type BlockScore } from "@/components/simulated-poster";
import { TiltFrame } from "@/components/tilt-frame";
import { UploadScan } from "@/components/upload-scan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { PAPER_SIZES, type AdapterMode, type PaperSize, type PosterRecord, type VisionProfile } from "@/lib/data";
import { CoreFailure, type CoreErrorCode } from "@/lib/errors";
import { MAX_DISTANCE_M, MIN_DISTANCE_M, maxReadableDistanceM, verdictAt } from "@/lib/legibility";
import { renderReportPng } from "@/lib/report";
import type { LabView } from "@/lib/schemas";

export interface LabState {
  posterId: string;
  size: PaperSize;
  distanceM: number;
  profileId: VisionProfile["id"];
  view?: LabView;
}

/* The report image has its own sentences per CoreFailure code; the scan hints talk about OCR. */
const REPORT_HINT: Record<CoreErrorCode, string> = {
  invalid_input: "This poster has no text lines yet, so there is nothing to put in the report.",
  upstream_timeout: "Drawing the report took too long, so try again.",
  upstream_error: "The report image could not be drawn, so try again or take a screenshot of the lab.",
  parse_failure: "The uploaded image could not be redrawn for the report, so upload it again and retry.",
  not_configured: "This browser cannot draw the report image, so try a current Chrome, Firefox or Safari.",
};

/** DEMO step 7: downloads the PNG report of what the lab shows right now. */
function ReportDownload({
  poster,
  size,
  distanceM,
  profile,
}: {
  poster: PosterRecord | undefined;
  size: PaperSize;
  distanceM: number;
  profile: VisionProfile | undefined;
}) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; code: CoreErrorCode }>({
    kind: "idle",
  });
  const reason = !poster || !profile
    ? "Pick an example poster or upload your own to get a report."
    : poster.blocks.length === 0
      ? "This poster has no text lines yet, so there is nothing to report."
      : null;

  async function download() {
    if (!poster || !profile || state.kind === "busy") return;
    setState({ kind: "busy" });
    try {
      await renderReportPng({ poster, size, distanceM, profile });
      setState({ kind: "done" });
    } catch (err) {
      setState({ kind: "error", code: err instanceof CoreFailure ? err.core.error : "upstream_error" });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        className="min-h-11 w-full sm:w-auto sm:self-start"
        onClick={download}
        disabled={reason !== null || state.kind === "busy"}
        aria-describedby="report-note"
      >
        <Download />
        {state.kind === "busy" ? "Drawing the report" : "Download PNG report"}
      </Button>
      <p id="report-note" className="text-xs text-muted-foreground" aria-live="polite">
        {reason ??
          (state.kind === "error"
            ? REPORT_HINT[state.code]
            : state.kind === "done"
              ? "Saved: the poster at this distance, every line's distance and its fix."
              : "One image with the poster at this distance, every line's distance and its fix. Drawn in this browser.")}
      </p>
    </div>
  );
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
  const [view, setView] = useState<LabView>(initial.view ?? "flat");

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

  // Lines that still read (legible or borderline) at the current distance: the gauge's figure.
  const readableCount = Object.values(scores).filter((s) => s.verdict !== "lost").length;
  const landscape = (poster?.aspect ?? 1 / Math.SQRT2) > 1;

  // Shareable state: every setting lives in the URL, so a result has a link.
  useEffect(() => {
    const params = new URLSearchParams();
    if (!upload && posterId) params.set("poster", posterId);
    params.set("size", size);
    params.set("d", distanceM.toFixed(1));
    params.set("profile", profileId);
    if (view === "corridor") params.set("view", "corridor");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [posterId, upload, size, distanceM, profileId, view]);

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
          <div className="flex min-w-0 flex-col gap-4">
            {uploadCard}
            <ReportDownload poster={poster} size={size} distanceM={distanceM} profile={profile} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <Card className="flex min-w-0 flex-col overflow-hidden bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                <LinesGauge readable={readableCount}
                  total={poster.blocks.length}
                  distanceM={distanceM}
                  settleKey={`${poster.id}|${size}|${profile.id}`}
                />
                <p className="min-w-0 text-xs text-muted-foreground">
                  <strong className="text-foreground">{poster.title}</strong> on {size}, {profile.label}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid grid-cols-2 gap-1" role="group" aria-label="Stage">
                  <Button
                    variant="choice"
                    size="sm"
                    className="min-h-11"
                    aria-pressed={view === "flat"}
                    onClick={() => setView("flat")}
                  >
                    Flat
                  </Button>
                  <Button
                    variant="choice"
                    size="sm"
                    className="min-h-11"
                    aria-pressed={view === "corridor"}
                    onClick={() => setView("corridor")}
                  >
                    Corridor
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  onClick={() => setShowVerdicts((v) => !v)}
                  aria-pressed={showVerdicts}
                >
                  {showVerdicts ? <EyeOff /> : <Eye />}
                  {showVerdicts ? "Hide verdicts" : "Show verdicts"}
                </Button>
              </div>
            </div>
            {view === "corridor" ? (
              <div key="corridor" className="telora-enter p-3 sm:p-5">
                <CorridorView
                  poster={poster}
                  size={size}
                  distanceM={distanceM}
                  profile={profile}
                  scores={scores}
                  showVerdicts={showVerdicts}
                />
              </div>
            ) : (
              <div
                key="flat"
                className="flex h-[min(58vh,38rem)] min-h-[22rem] w-full max-w-full items-center justify-center p-4 pt-8 sm:min-h-[26rem] sm:p-6 sm:pt-8 telora-enter [container-type:size]"
              >
                <TiltFrame className={landscape ? "flex w-full items-center justify-center" : "h-full max-w-full"}>
                  <SimulatedPoster
                    poster={poster}
                    size={size}
                    distanceM={distanceM}
                    profile={profile}
                    scores={scores}
                    showVerdicts={showVerdicts}
                  />
                </TiltFrame>
              </div>
            )}
            <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Hangs at: {poster.hangingSpot}. Owner: {poster.owner}. Last edited {poster.updated}.
            </p>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
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
                      <Button key={s} variant="choice" className="min-h-11" aria-pressed={size === s} onClick={() => setSize(s)}>
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
                    className="min-h-11"
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
                        className="h-auto min-h-11 whitespace-normal py-2"
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

            <Entrance className="min-w-0">
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
                  <ReportDownload poster={poster} size={size} distanceM={distanceM} profile={profile} />
                </CardContent>
              </Card>
            </Entrance>

            {uploadCard}
          </div>
        </div>
      )}
    </section>
  );
}
