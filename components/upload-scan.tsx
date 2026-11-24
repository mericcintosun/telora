"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SceneSlot } from "@/components/scene-slot";
import type { PosterRecord } from "@/lib/data";
import { scanPosterImage, type ScanProgress } from "@/lib/ocr";

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning"; progress: ScanProgress; fileName: string }
  | { kind: "done"; fileName: string; lines: number }
  | { kind: "error"; message: string };

/** Upload card: the visitor's own poster goes through the real Tesseract.js scan. */
export function UploadScan({
  onScanned,
  onReset,
}: {
  onScanned: (poster: PosterRecord) => void;
  onReset: () => void;
}) {
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [inputKey, setInputKey] = useState(0);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setState({ kind: "error", message: "Telora reads PNG, JPG and WebP for now. Export the first page of a PDF as PNG." });
      return;
    }
    setState({ kind: "scanning", fileName: file.name, progress: { stage: "Starting", progress: 0 } });
    try {
      const poster = await scanPosterImage(file, (progress) =>
        setState({ kind: "scanning", fileName: file.name, progress })
      );
      setState({ kind: "done", fileName: file.name, lines: poster.blocks.length });
      onScanned(poster);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "The scan failed. Check your connection and try again.",
      });
    }
  }

  return (
    <Card id="upload" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Check your own poster</CardTitle>
        <CardDescription>
          The scan runs in this browser with Tesseract.js. Your file never leaves the page.
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
            <div className="h-3 overflow-hidden rounded-full border border-border bg-surface">
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-3 text-sm" aria-live="polite">
            <span>
              Found {state.lines} text lines in <strong>{state.fileName}</strong>. Distances use the measured letter height.
            </span>
            <Button
              variant="outline"
              size="sm"
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
            <span>{state.message}</span>
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
