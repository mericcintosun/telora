// PNG report, drawn in the browser. No server route, no file system: the canvas is created
// inside renderReportPng at call time (never at module load), the colors are read from the
// CSS variables in app/globals.css, and the file leaves through a revoked object URL.
//
// The numbers are the lab's own: maxReadableDistanceM, verdictAt, fixRecipe and blurSigmaPx
// from lib/legibility.ts, and confirmationLine from lib/confirm.ts.

import type { PaperSize, PosterBlock, PosterRecord, Tone, VisionProfile } from "@/lib/types";
import { confirmationLine } from "@/lib/confirm";
import { CoreFailure, failWith } from "@/lib/errors";
import { blurSigmaPx, fixRecipe, formatMeters, maxReadableDistanceM, verdictAt, type Verdict } from "@/lib/legibility";

export interface ReportInput {
  poster: PosterRecord;
  size: PaperSize;
  distanceM: number;
  profile: VisionProfile;
}

const W = 1600;
const PAD = 64;
const HEADER_H = 220;
const POSTER_MAX_H = 960;
const POSTER_MAX_W = 860;
const COL_GAP = 64;
const FOOTER_H = 120;
const MAX_H = 6000;

const TONE_CSS_VAR: Record<Tone, string> = {
  ink: "--t-ink",
  ground: "--t-ground",
  surface: "--t-surface",
  deep: "--t-deep",
  accent: "--t-accent",
  onAccent: "--t-on-accent",
  second: "--t-second",
  ok: "--t-ok",
  bad: "--t-bad",
};

const VERDICT_WORD: Record<Verdict, string> = { legible: "Reads", borderline: "Borderline", lost: "Lost" };

interface Palette {
  ink: string;
  ground: string;
  surface: string;
  line: string;
  muted: string;
  onAccent: string;
  verdict: Record<Verdict, string>;
  tone: (t: Tone) => string;
}

interface Fonts {
  display: string;
  body: string;
}

interface Row {
  block: PosterBlock;
  maxM: number;
  verdict: Verdict;
  title: string;
  lines: string[];
  height: number;
}

type Ctx = CanvasRenderingContext2D;

function readVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = styles.getPropertyValue(name).trim();
  return v || fallback;
}

function readPalette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const toneCache = new Map<Tone, string>();
  const tone = (t: Tone) => {
    const hit = toneCache.get(t);
    if (hit) return hit;
    const v = readVar(s, TONE_CSS_VAR[t], "black");
    toneCache.set(t, v);
    return v;
  };
  return {
    ink: tone("ink"),
    ground: tone("ground"),
    surface: tone("surface"),
    line: readVar(s, "--t-line", "silver"),
    muted: readVar(s, "--muted-foreground", "gray"),
    onAccent: tone("onAccent"),
    verdict: { legible: tone("ok"), borderline: readVar(s, "--t-warn", "orange"), lost: tone("bad") },
    tone,
  };
}

function readFonts(): Fonts {
  const s = getComputedStyle(document.documentElement);
  const display = readVar(s, "--font-rh-display", "");
  const body = readVar(s, "--font-rh-text", "");
  return {
    display: display ? `${display}, system-ui, sans-serif` : "system-ui, sans-serif",
    body: body ? `${body}, system-ui, sans-serif` : "system-ui, sans-serif",
  };
}

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [""];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(failWith("parse_failure"));
    img.src = src;
  });
}

function newCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw failWith("not_configured");
  return { canvas, ctx };
}

type Box = { x: number; y: number; w: number; h: number };

/** The sharp poster artwork, the same layout rules as SimulatedPoster. Returns each block's box. */
function drawPosterLayer(
  poster: PosterRecord,
  w: number,
  h: number,
  pal: Palette,
  fonts: Fonts,
  image: HTMLImageElement | null
): { canvas: HTMLCanvasElement; boxes: Map<string, Box> } {
  const { canvas, ctx } = newCanvas(w, h);
  const boxes = new Map<string, Box>();
  ctx.fillStyle = pal.tone(poster.background);
  ctx.fillRect(0, 0, w, h);
  if (image) ctx.drawImage(image, 0, 0, w, h);

  for (const b of poster.blocks) {
    const fs = ((b.capHeightPct / 100) * h) / 0.7;
    const lineH = fs * 1.15;
    const padX = b.backdrop ? fs * 0.45 : 0;
    const padY = b.backdrop ? fs * 0.25 : 0;
    const left = (b.x / 100) * w;
    const top = (b.y / 100) * h;
    const boxW = (b.w / 100) * w;
    const family = b.role === "title" || b.role === "banner" ? fonts.display : fonts.body;
    ctx.font = `${b.weight} ${fs}px ${family}`;
    const lines = wrap(ctx, b.text, Math.max(1, boxW - padX * 2));
    const textH = lines.length * lineH + padY * 2;
    const boxH = b.h !== undefined ? (b.h / 100) * h : textH;
    boxes.set(b.id, { x: left, y: top, w: boxW, h: boxH });
    if (image) continue; // An upload already carries its own text in the image.

    if (b.backdrop) {
      ctx.fillStyle = pal.tone(b.backdrop);
      roundRectPath(ctx, left, top, boxW, textH, fs * 0.35);
      ctx.fill();
    }
    ctx.fillStyle = pal.tone(b.tone);
    ctx.textBaseline = "top";
    ctx.textAlign = b.align === "center" ? "center" : "left";
    const x = b.align === "center" ? left + boxW / 2 : left + padX;
    lines.forEach((line, i) => {
      ctx.fillText(line, x, top + padY + i * lineH + (lineH - fs) / 2);
    });
  }
  return { canvas, boxes };
}

function buildRows(ctx: Ctx, input: ReportInput, colW: number, fonts: Fonts): Row[] {
  const { poster, size, distanceM, profile } = input;
  const rows = poster.blocks.map((block) => {
    const maxM = maxReadableDistanceM(block, size, profile);
    return { block, maxM, verdict: verdictAt(maxM, distanceM) };
  });
  rows.sort((a, b) => a.maxM - b.maxM);

  return rows.map((r, i) => {
    const recipe = fixRecipe(r.block, size, profile, distanceM);
    const parts = [`Readable up to ${formatMeters(r.maxM)}.`];
    if (recipe?.kind === "enlarge") {
      parts.push(
        `To read at ${distanceM.toFixed(1)} m, enlarge it ${recipe.factor.toFixed(1)}x, from ${Math.round(recipe.fromPt)} pt to ${Math.ceil(recipe.toPt)} pt.`
      );
    } else if (recipe?.kind === "recolor") {
      parts.push(`Size will not save it: for ${profile.label} vision this pair has no brightness difference. Change the color pair.`);
    }
    const ocr = r.block.ocr;
    if (ocr && ocr.size === size && ocr.profileId === profile.id) {
      const line = confirmationLine(r.block, r.maxM);
      if (line) parts.push(`${line}.`);
    }
    ctx.font = `400 24px ${fonts.body}`;
    const lines = parts.flatMap((p) => wrap(ctx, p, colW));
    const height = 44 + lines.length * 32 + 28;
    return { ...r, title: `${i + 1}. ${r.block.label}`, lines, height };
  });
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "poster"
  );
}

/**
 * Draws the report (simulated poster with numbered outlines, per-line distances, fix recipes)
 * and downloads it as a PNG. Throws a CoreFailure on any problem:
 * not_configured (no DOM or no 2D canvas), parse_failure (the uploaded image will not redraw),
 * upstream_error (anything else, including a canvas that will not encode).
 */
export async function renderReportPng(input: ReportInput): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") throw failWith("not_configured");
  try {
    const { poster, size, distanceM, profile } = input;
    if (poster.blocks.length === 0) throw failWith("invalid_input");
    if (document.fonts?.ready) await document.fonts.ready;

    const pal = readPalette();
    const fonts = readFonts();
    const aspect = poster.aspect ?? 1 / Math.SQRT2;
    let posterH = POSTER_MAX_H;
    let posterW = posterH * aspect;
    if (posterW > POSTER_MAX_W) {
      posterW = POSTER_MAX_W;
      posterH = posterW / aspect;
    }
    const colX = PAD + posterW + COL_GAP;
    const colW = W - colX - PAD;

    const image = poster.imageUrl ? await loadImage(poster.imageUrl) : null;
    const { canvas, ctx } = newCanvas(W, 100);
    const rows = buildRows(ctx, input, colW, fonts);
    const rowsH = rows.reduce((sum, r) => sum + r.height, 0);
    const H = Math.min(MAX_H, Math.ceil(HEADER_H + Math.max(posterH + 32, rowsH) + FOOTER_H));
    canvas.height = H;

    // Ground and header.
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = pal.ink;
    ctx.font = `900 44px ${fonts.display}`;
    ctx.fillText("Telora poster report", PAD, PAD - 8);
    ctx.font = `600 26px ${fonts.body}`;
    ctx.fillText(`${poster.title} on ${size} at ${distanceM.toFixed(1)} m, ${profile.label} vision`, PAD, PAD + 52);
    const lost = rows.filter((r) => r.verdict === "lost").length;
    ctx.font = `700 26px ${fonts.body}`;
    ctx.fillStyle = lost === 0 ? pal.verdict.legible : pal.verdict.lost;
    ctx.fillText(
      lost === 0 ? `Every line reads at ${distanceM.toFixed(1)} m.` : `${lost} of ${rows.length} lines lost at ${distanceM.toFixed(1)} m.`,
      PAD,
      PAD + 92
    );
    ctx.fillStyle = pal.line;
    ctx.fillRect(PAD, HEADER_H - 24, W - PAD * 2, 2);

    // The poster, blurred the way the live preview blurs it, then the sharp outlines on top.
    const px = PAD;
    const py = HEADER_H;
    ctx.fillStyle = pal.surface;
    roundRectPath(ctx, px - 16, py - 16, posterW + 32, posterH + 32, 24);
    ctx.fill();
    const layer = drawPosterLayer(poster, posterW, posterH, pal, fonts, image);
    const canFilter = "filter" in ctx;
    if (canFilter) {
      const sigma = blurSigmaPx(posterH, size, distanceM, profile);
      ctx.filter = [`blur(${sigma.toFixed(2)}px)`, profile.id === "lowcontrast" ? "contrast(0.55)" : ""].filter(Boolean).join(" ");
    }
    ctx.save();
    roundRectPath(ctx, px, py, posterW, posterH, 18);
    ctx.clip();
    ctx.drawImage(layer.canvas, px, py, posterW, posterH);
    ctx.restore();
    if (canFilter) ctx.filter = "none";

    rows.forEach((r, i) => {
      const box = layer.boxes.get(r.block.id);
      if (!box) return;
      ctx.strokeStyle = pal.verdict[r.verdict];
      ctx.lineWidth = 4;
      roundRectPath(ctx, px + box.x - 5, py + box.y - 5, box.w + 10, box.h + 10, 12);
      ctx.stroke();
      const cx = Math.max(px + 16, px + box.x - 5);
      const cy = Math.max(py + 16, py + box.y - 5);
      ctx.fillStyle = pal.verdict[r.verdict];
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.onAccent;
      ctx.font = `700 18px ${fonts.body}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), cx, cy + 1);
    });

    // One row per line, weakest first.
    let y = HEADER_H;
    for (const r of rows) {
      if (y + r.height > H - FOOTER_H) break;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = pal.ink;
      ctx.font = `700 28px ${fonts.body}`;
      ctx.fillText(r.title, colX, y);
      const word = VERDICT_WORD[r.verdict];
      ctx.font = `700 20px ${fonts.body}`;
      const pillW = ctx.measureText(word).width + 28;
      ctx.fillStyle = pal.verdict[r.verdict];
      roundRectPath(ctx, colX + colW - pillW, y, pillW, 32, 16);
      ctx.fill();
      ctx.fillStyle = pal.onAccent;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(word, colX + colW - pillW / 2, y + 17);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = pal.ink;
      ctx.font = `400 24px ${fonts.body}`;
      r.lines.forEach((line, i) => ctx.fillText(line, colX, y + 44 + i * 32));
      ctx.fillStyle = pal.line;
      ctx.fillRect(colX, y + r.height - 14, colW, 1);
      y += r.height;
    }

    // Footer: what the image does and does not show.
    ctx.fillStyle = pal.muted;
    ctx.font = `400 20px ${fonts.body}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const notes = [
      "Made in the browser with Telora. Distances use an 8 arcmin cap height threshold for 20/20 vision, scaled for the profile and the color contrast.",
      [
        canFilter ? "The poster is blurred to the eye's limit at this distance." : "This browser has no canvas blur, so the poster is drawn sharp.",
        profile.deutan ? "The deuteranopia color filter shows only in the live lab; the distances above include it." : "",
      ]
        .filter(Boolean)
        .join(" "),
    ];
    notes.flatMap((n) => wrap(ctx, n, W - PAD * 2)).forEach((line, i) => ctx.fillText(line, PAD, H - FOOTER_H + 16 + i * 28));

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw failWith("upstream_error");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telora-${slug(poster.title)}-${size}-${distanceM.toFixed(1)}m.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke after the browser has started the download (Safari needs a moment).
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    if (err instanceof CoreFailure) throw err;
    throw failWith("upstream_error");
  }
}
