import { Badge } from "@/components/ui/badge";
import type { PaperSize, PosterBlock, PosterRecord, VisionProfile } from "@/lib/data";
import { confirmationLine, ocrAgrees } from "@/lib/confirm";
import { fixRecipe, formatMeters } from "@/lib/legibility";
import type { BlockScore } from "@/components/simulated-poster";

const VERDICT_LABEL = { legible: "Reads", borderline: "Borderline", lost: "Lost" } as const;

/** The OCR line under a block: the comparison, or why it cannot be compared right now. */
function OcrNote({
  block,
  size,
  profile,
  modelMaxM,
}: {
  block: PosterBlock;
  size: PaperSize;
  profile: VisionProfile;
  modelMaxM: number;
}) {
  const ocr = block.ocr;
  if (!ocr) return null;
  const source = ocr.basis === "sample" ? "Sample OCR" : "OCR";
  if (ocr.size !== size) {
    return (
      <p className="text-xs text-muted-foreground">
        {ocr.basis === "live"
          ? `OCR was checked at ${ocr.size}; upload again to re-check at ${size}.`
          : `Sample OCR was checked at ${ocr.size}; switch back to ${ocr.size} to compare.`}
      </p>
    );
  }
  if (ocr.profileId !== profile.id) {
    return (
      <p className="text-xs text-muted-foreground">
        {source} was checked for a different vision profile; switch back
        {ocr.basis === "live" ? " or upload again" : ""} to compare.
      </p>
    );
  }
  const line = confirmationLine(block, modelMaxM);
  if (!line) return null;
  return (
    <p className={`text-sm font-semibold ${ocrAgrees(ocr.maxDistanceM, modelMaxM) ? "text-ok" : "text-warn"}`}>{line}</p>
  );
}

/** One row per text block, weakest first: how far it reads, what OCR says, and what fixes it. */
export function BlockReport({
  poster,
  size,
  distanceM,
  profile,
  scores,
}: {
  poster: PosterRecord;
  size: PaperSize;
  distanceM: number;
  profile: VisionProfile;
  scores: Record<string, BlockScore>;
}) {
  if (poster.blocks.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">No text lines found for this poster.</p>;
  }

  const rows = [...poster.blocks]
    .filter((b) => scores[b.id])
    .sort((a, b) => scores[a.id].maxDistanceM - scores[b.id].maxDistanceM);

  return (
    <ol className="divide-y divide-border">
      {rows.map((b) => {
        const score = scores[b.id];
        const recipe = fixRecipe(b, size, profile, distanceM);
        return (
          <li key={b.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{b.label}</span>
              <Badge key={score.verdict} variant={score.verdict} className="telora-enter">
                {VERDICT_LABEL[score.verdict]}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground" title={b.text}>
              {b.text}
            </p>
            <p className="text-sm">
              Readable up to <strong>{formatMeters(score.maxDistanceM)}</strong>
              {recipe?.kind === "enlarge" && (
                <>
                  . To read at {distanceM.toFixed(1)} m, enlarge it {recipe.factor.toFixed(1)}x, from{" "}
                  {Math.round(recipe.fromPt)} pt to {Math.ceil(recipe.toPt)} pt.
                </>
              )}
              {recipe?.kind === "recolor" && (
                <>. Size will not save it: for {profile.label} vision this pair has no brightness difference. Change the color pair.</>
              )}
              {!recipe && "."}
            </p>
            <OcrNote block={b} size={size} profile={profile} modelMaxM={score.maxDistanceM} />
          </li>
        );
      })}
    </ol>
  );
}
