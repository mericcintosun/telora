"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SceneSlot } from "@/components/scene-slot";
import { CoreFailure, scanErrorHint, type CoreErrorCode } from "@/lib/errors";
import type { PaperSize, PosterRecord, VisionProfile } from "@/lib/data";
import { SCAN_DISTANCES_M } from "@/lib/legibility";
import { scanPosterImage, type BlurMode, type ScanProgress } from "@/lib/ocr";
import { UploadFileSchema } from "@/lib/schemas";

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning"; progress: ScanProgress; fileName: string }
  | {
      kind: "done";
      fileName: string;
      lines: number;
      /** Lines with a live OCR result; 0 when the confirmation did not run. */
      confirmed: number;
      confirmCode?: CoreErrorCode;
      blurMode?: BlurMode;
      fromCache: boolean;
    }
  | { kind: "error"; code: CoreErrorCode };

/** Upload card: the visitor's own poster goes through the real Tesseract.js scan and 8-distance re-read. */
export function UploadScan({
  size,
  profile,
  onScanned,
  onReset,
}: {
  size: PaperSize;
  profile: VisionProfile | undefined;
  onScanned: (poster: PosterRecord) => void;
  onReset: () => void;
}) {
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [inputKey, setInputKey] = useState(0);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!UploadFileSchema.safeParse({ type: file.type, size: file.size }).success) {
      setState({ kind: "error", code: "invalid_input" });
      return;
    }
    setState({ kind: "scanning", fileName: file.name, progress: { stage: "Starting", progress: 0 } });
    try {
      const result = await scanPosterImage(
        file,
        (progress) => setState({ kind: "scanning", fileName: file.name, progress }),
        { size, profile }
      );
      setState({
        kind: "done",
        fileName: file.name,
        lines: result.poster.blocks.length,
        confirmed: result.poster.blocks.filter((b) => b.ocr?.basis === "live").length,
        confirmCode: result.confirmError?.error,
        blurMode: result.blurMode,
        fromCache: result.fromCache,
      });
      onScanned(result.poster);
    } catch (err) {
      setState({ kind: "error", code: err instanceof CoreFailure ? err.core.error : "upstream_error" });
    }
  }

  return (
    <Card id="upload" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Check your own poster</CardTitle>
        <CardDescription>
          The scan runs in this browser with Tesseract.js. Your file never leaves the page.
        </CardDescription>
        <CardDescription>
          It then re-reads the poster blurred to {SCAN_DISTANCES_M.length} distances. The OCR is a machine reader, so it
          checks the distance model rather than replacing it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state.kind === "idle" && (
          <SceneSlot
            n={1}
            alt="A student holds a magenta event poster at the end of a long peach hallway while distance markers on the floor count away from it"
            width={960}
            height={640}
            className="rounded-xl border border-border"
          />
        )}

        <Input
          key={inputKey}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Poster image"
          disabled={state.kind === "scanning"}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {state.kind === "scanning" && (
          <div className="flex flex-col gap-2" aria-live="polite">
            <div
              className="h-3 overflow-hidden rounded-full border border-border bg-surface"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress.progress * 100)}
              aria-label="Scan progress"
            >
              <div
                className="h-full rounded-full bg-magenta transition-[width] duration-300"
                style={{ width: `${Math.round(state.progress.progress * 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {state.progress.stage} ({Math.round(state.progress.progress * 100)}%), {state.fileName}
            </p>
          </div>
        )}

        {state.kind === "done" && (
          <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 text-sm" aria-live="polite">
            <p>
              Found {state.lines} text lines in <strong>{state.fileName}</strong>. Distances use the measured letter
              height.
            </p>
            {state.confirmed > 0 ? (
              <p className="font-semibold text-ok">
                OCR confirmed {state.confirmed} lines at {SCAN_DISTANCES_M.length} distances.
              </p>
            ) : (
              <p className="text-warn">
                The OCR check did not finish. {scanErrorHint(state.confirmCode ?? "upstream_error")} The model
                distances below still hold.
              </p>
            )}
            {state.blurMode === "downscale" && (
              <p className="text-xs text-muted-foreground">
                This browser has no canvas blur filter, so the re-read used a downscale blur. It is close to the
                preview blur, not identical.
              </p>
            )}
            {state.fromCache && (
              <p className="text-xs text-muted-foreground">Same file, size and profile as before, so this came from the tab&apos;s cache.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                setState({ kind: "idle" });
                setInputKey((k) => k + 1);
                onReset();
              }}
            >
              Back to the examples
            </Button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col gap-3 rounded-xl border border-bad/50 bg-surface p-3 text-sm" role="alert">
            <span>{scanErrorHint(state.code)}</span>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                setState({ kind: "idle" });
                setInputKey((k) => k + 1);
              }}
            >
              Pick another file
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
