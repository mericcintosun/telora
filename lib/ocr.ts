// Poster scanning. Browser only: call it from a "use client" component.
//
// 1. First pass: Tesseract.js (dynamic import, runs in Web Workers) finds every text line
//    on the uploaded poster with its bounding box; the canvas measures each line's luminance
//    contrast, as-is and after the Machado 2009 deuteranopia transform.
// 2. Confirmation (confirmAtDistances): the poster is blurred to the eye's limit at each of
//    the 8 distances in SCAN_DISTANCES_M (sigma from blurSigmaPx) and read again. A line
//    counts as readable while at least OCR_PASS_RATIO of its words still match.
//
// Tesseract is a machine reader, not a person: its distances check the model in
// lib/legibility.ts, they do not replace it. Every tuning number lives in lib/config.ts.

import type { Page, Scheduler, Worker as OcrWorker } from "tesseract.js";
import { getCachedScan, scanCacheKey, setCachedScan, type BlurMode } from "@/lib/cache";
import {
  CAP_OF_LINE_BOX,
  CORE_LOG_PREFIX,
  DEUTAN_MATRIX,
  OCR_DOWNSCALE_PER_SIGMA,
  OCR_JOB_TIMEOUT_MS,
  OCR_LOAD_TIMEOUT_MS,
  OCR_LONG_EDGE_PX,
  OCR_MAX_LINES,
  OCR_MIN_CONFIDENCE,
  OCR_PASS_RATIO,
  OCR_RETRIES,
  OCR_WORKERS,
} from "@/lib/config";
import { assignWordsToBlocks, normalizeWords, ocrMaxDistanceM, wordMatchRatio, type PctWord } from "@/lib/confirm";
import { CoreFailure, coreError, failWith, toCoreError, type CoreError } from "@/lib/errors";
import { SCAN_DISTANCES_M, blurSigmaPx } from "@/lib/legibility";
import { UploadFileSchema } from "@/lib/schemas";
import type { BlockOcr, PaperSize, PosterBlock, PosterRecord, ScanProgress, VisionProfile } from "@/lib/types";

// The shape lives in lib/types.ts; re-exported so `import { type ScanProgress } from "@/lib/ocr"` keeps working.
export type { ScanProgress } from "@/lib/types";
export type { CoreError, CoreErrorCode } from "@/lib/errors";
export type { BlurMode } from "@/lib/cache";
export { scanErrorHint } from "@/lib/errors";

type TesseractApi = Pick<typeof import("tesseract.js"), "createWorker" | "createScheduler">;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
interface Surface {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: Ctx2D;
}
interface ProgressHooks {
  onRecognize: ((p: number) => void) | null;
}
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Progress bar stops. The 8 re-reads fill CONFIRM_START to CONFIRM_END. */
const P = {
  read: 0.03,
  engine: 0.08,
  findStart: 0.2,
  findSpan: 0.3,
  contrast: 0.52,
  confirmStart: 0.55,
  confirmEnd: 0.98,
} as const;

const DATE_PATTERN = /\b(\d{1,2}[:.]\d{2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|(mon|tue|wed|thu|fri|sat|sun)\w*day)\b/i;

// ---------- logging (ids, counts and durations only, never poster text) ----------

function log(step: string, data?: Record<string, number | string>): void {
  if (data) console.info(`${CORE_LOG_PREFIX} ${step}`, data);
  else console.info(`${CORE_LOG_PREFIX} ${step}`);
}

function since(t0: number): number {
  return Math.round(performance.now() - t0);
}

// ---------- timeout and the single retry ----------

/** Rejects with upstream_timeout after ms. A value that arrives late goes to onLate for cleanup. */
function withTimeout<T>(work: Promise<T>, ms: number, onLate?: (value: T) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(failWith("upstream_timeout"));
    }, ms);
    work.then(
      (value) => {
        if (settled) {
          onLate?.(value);
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err instanceof CoreFailure ? err : failWith("upstream_error"));
      }
    );
  });
}

async function loadTesseract(): Promise<TesseractApi> {
  try {
    const mod = await import("tesseract.js");
    const withDefault = mod as unknown as { default?: TesseractApi };
    return withDefault.default ?? (mod as unknown as TesseractApi);
  } catch {
    throw failWith("upstream_error");
  }
}

/** Creates one worker (downloads engine and language data) with a timeout and exactly OCR_RETRIES retry. */
async function loadWorker(T: TesseractApi, hooks: ProgressHooks): Promise<OcrWorker> {
  const attempt = () =>
    withTimeout(
      T.createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") hooks.onRecognize?.(m.progress);
        },
      }),
      OCR_LOAD_TIMEOUT_MS,
      (late) => void late.terminate().catch(() => undefined)
    );
  try {
    return await attempt();
  } catch (first) {
    if (OCR_RETRIES < 1) throw first;
    log("ocr worker retry");
    return await attempt();
  }
}

/** A scheduler with up to OCR_WORKERS workers. Fails only when no worker could start. */
async function startScheduler(T: TesseractApi, hooks: ProgressHooks): Promise<Scheduler> {
  const t0 = performance.now();
  const settled = await Promise.allSettled(Array.from({ length: OCR_WORKERS }, () => loadWorker(T, hooks)));
  const workers = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
  if (workers.length === 0) {
    const first = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
    const reason: unknown = first ? first.reason : undefined;
    throw reason instanceof CoreFailure ? reason : failWith("upstream_error");
  }
  const scheduler = T.createScheduler();
  for (const w of workers) scheduler.addWorker(w);
  log("ocr worker ready", { workers: workers.length, ms: since(t0) });
  return scheduler;
}

/** One recognize job through the scheduler, bounded by OCR_JOB_TIMEOUT_MS. */
async function recognizeJob(scheduler: Scheduler, image: HTMLCanvasElement | Blob): Promise<Page> {
  const result = await withTimeout(scheduler.addJob("recognize", image, {}, { blocks: true }), OCR_JOB_TIMEOUT_MS);
  return result.data;
}

// ---------- canvas helpers ----------

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Contrast between the 10th and 90th luminance percentile inside a box. */
function measureContrast(ctx: CanvasRenderingContext2D, box: Box, deutan: boolean): number {
  const w = Math.max(1, Math.round(box.x1 - box.x0));
  const h = Math.max(1, Math.round(box.y1 - box.y0));
  const { data } = ctx.getImageData(Math.round(box.x0), Math.round(box.y0), w, h);
  const M = DEUTAN_MATRIX;
  const values: number[] = [];
  for (let i = 0; i < data.length; i += 16) {
    let r = toLinear(data[i]);
    let g = toLinear(data[i + 1]);
    let b = toLinear(data[i + 2]);
    if (deutan) {
      const nr = M[0] * r + M[1] * g + M[2] * b;
      const ng = M[3] * r + M[4] * g + M[5] * b;
      const nb = M[6] * r + M[7] * g + M[8] * b;
      r = Math.min(1, Math.max(0, nr));
      g = Math.min(1, Math.max(0, ng));
      b = Math.min(1, Math.max(0, nb));
    }
    values.push(luminance(r, g, b));
  }
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.1)] ?? 0;
  const hi = values[Math.floor(values.length * 0.9)] ?? 1;
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

async function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw failWith("invalid_input");
  }
  return { img, url };
}

/** An OffscreenCanvas when the browser has one, otherwise a detached <canvas>. */
function makeSurface(w: number, h: number): Surface | null {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (ctx) return { canvas, ctx };
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/** ctx.filter is missing in Safari; there the blur falls back to downscale then upscale. */
function supportsFilter(ctx: Ctx2D): boolean {
  if (!("filter" in ctx)) return false;
  ctx.filter = "blur(2px)";
  const ok = ctx.filter === "blur(2px)";
  ctx.filter = "none";
  return ok;
}

function drawBlurred(target: Surface, tmp: Surface | null, source: HTMLCanvasElement, sigma: number, mode: BlurMode): void {
  const W = source.width;
  const H = source.height;
  const { ctx } = target;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
  if (mode === "filter" || !tmp) {
    ctx.filter = `blur(${sigma.toFixed(2)}px)`;
    ctx.drawImage(source, 0, 0);
    ctx.filter = "none";
    return;
  }
  // Shrinking by k pixels and scaling back up spreads each pixel over about k / 2 sigma.
  const k = Math.max(1, sigma * OCR_DOWNSCALE_PER_SIGMA);
  const sw = Math.max(1, Math.round(W / k));
  const sh = Math.max(1, Math.round(H / k));
  tmp.canvas.width = sw;
  tmp.canvas.height = sh;
  tmp.ctx.imageSmoothingEnabled = true;
  tmp.ctx.imageSmoothingQuality = "high";
  tmp.ctx.drawImage(source, 0, 0, sw, sh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tmp.canvas, 0, 0, sw, sh, 0, 0, W, H);
}

async function toPngBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: "image/png" });
  }
  const el = canvas as HTMLCanvasElement;
  return new Promise<Blob | null>((resolve) => el.toBlob(resolve, "image/png"));
}

function pageWords(page: Page, W: number, H: number): PctWord[] {
  const out: PctWord[] = [];
  for (const block of page.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        for (const word of line.words) {
          out.push({
            text: word.text,
            x0: (word.bbox.x0 / W) * 100,
            y0: (word.bbox.y0 / H) * 100,
            x1: (word.bbox.x1 / W) * 100,
            y1: (word.bbox.y1 / H) * 100,
          });
        }
      }
    }
  }
  return out;
}

// ---------- the 8-distance confirmation ----------

export interface ConfirmResult {
  blocks: PosterBlock[];
  blurMode: BlurMode;
}

/**
 * Re-reads the poster blurred to each of the 8 scan distances and attaches a live `ocr`
 * result to every block. Pass `deps.scheduler` to reuse running workers; otherwise this
 * starts its own and always terminates it. Throws CoreFailure on any failure.
 */
export async function confirmAtDistances(
  canvas: HTMLCanvasElement,
  blocks: PosterBlock[],
  size: PaperSize,
  profile: VisionProfile,
  onProgress: (p: ScanProgress) => void,
  deps: { scheduler?: Scheduler } = {}
): Promise<ConfirmResult> {
  const W = canvas.width;
  const H = canvas.height;
  const surface = makeSurface(W, H);
  if (!surface) throw failWith("not_configured");
  const blurMode: BlurMode = supportsFilter(surface.ctx) ? "filter" : "downscale";
  const tmp = blurMode === "downscale" ? makeSurface(1, 1) : null;
  if (blurMode === "downscale" && !tmp) throw failWith("not_configured");
  log("confirm start", { blocks: blocks.length, distances: SCAN_DISTANCES_M.length, blur: blurMode });

  const total = SCAN_DISTANCES_M.length;
  const t0 = performance.now();
  const owned = !deps.scheduler;
  let scheduler: Scheduler | null = deps.scheduler ?? null;

  const report = (done: number) => {
    const stage =
      done >= total
        ? `Re-read at all ${total} distances`
        : `Re-reading at ${SCAN_DISTANCES_M[done]} m (${done + 1} of ${total})`;
    onProgress({ stage, progress: P.confirmStart + ((P.confirmEnd - P.confirmStart) * done) / total });
  };

  try {
    if (!scheduler) scheduler = await startScheduler(await loadTesseract(), { onRecognize: null });
    const active = scheduler;
    report(0);

    let done = 0;
    const jobs: Promise<PctWord[]>[] = [];
    for (const d of SCAN_DISTANCES_M) {
      drawBlurred(surface, tmp, canvas, blurSigmaPx(H, size, d, profile), blurMode);
      const image = await toPngBlob(surface.canvas);
      if (!image) throw failWith("not_configured");
      const job = recognizeJob(active, image).then((page) => {
        done += 1;
        log(`pass ${done} of ${total} done`, { ms: since(t0) });
        report(done);
        return pageWords(page, W, H);
      });
      // Mark as handled now; Promise.all below still sees the rejection.
      job.catch(() => undefined);
      jobs.push(job);
    }
    const wordsByDistance = await Promise.all(jobs);

    const assigned = wordsByDistance.map((words) => assignWordsToBlocks(words, blocks));
    const out = blocks.map((b): PosterBlock => {
      const expected = normalizeWords(b.text);
      const ratios = assigned.map((byBlock) => wordMatchRatio(expected, byBlock[b.id] ?? []));
      const ocr: BlockOcr = {
        maxDistanceM: ocrMaxDistanceM(ratios, SCAN_DISTANCES_M, OCR_PASS_RATIO),
        matchByDistance: ratios.map((r) => Math.round(r * 100) / 100),
        size,
        profileId: profile.id,
        basis: "live",
      };
      return { ...b, ocr };
    });
    log("confirm ok", { blocks: out.length, ms: since(t0) });
    return { blocks: out, blurMode };
  } finally {
    if (owned && scheduler) await scheduler.terminate().catch(() => undefined);
  }
}

// ---------- the full scan ----------

export interface ScanResult {
  poster: PosterRecord;
  /** How the confirmation blurred the poster; absent when it did not run. */
  blurMode?: BlurMode;
  /** Set when the first pass worked but the 8-distance confirmation did not. Model distances still show. */
  confirmError?: CoreError;
  /** True when the result came from this tab's content-hash cache. */
  fromCache: boolean;
}

function uploadedPoster(file: File, url: string, blocks: PosterBlock[], aspect: number, size: PaperSize): PosterRecord {
  return {
    id: "uploaded",
    title: file.name.replace(/\.[a-z0-9]+$/i, ""),
    kind: "Club event",
    owner: "Your upload (stays in this browser)",
    hangingSpot: "Wherever you hang it",
    intendedSize: size,
    intendedDistanceM: 4,
    background: "ground",
    updated: new Date().toISOString().slice(0, 10),
    blocks,
    imageUrl: url,
    aspect,
  };
}

/**
 * Scans an uploaded poster, then confirms every line at the 8 scan distances for the given
 * paper size and vision profile. Throws CoreFailure when the file is invalid, the engine
 * cannot load or no text is found. A failed confirmation does not throw: the poster comes
 * back with model distances only and `confirmError` set.
 */
export async function scanPosterImage(
  file: File,
  onProgress: (p: ScanProgress) => void,
  opts: { size: PaperSize; profile: VisionProfile | undefined }
): Promise<ScanResult> {
  const t0 = performance.now();
  if (!UploadFileSchema.safeParse({ type: file.type, size: file.size }).success) throw failWith("invalid_input");

  onProgress({ stage: "Reading the image", progress: P.read });
  const { img, url } = await loadImage(file);

  const scale = Math.min(1, OCR_LONG_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const W = Math.round(img.naturalWidth * scale);
  const H = Math.round(img.naturalHeight * scale);

  const key = opts.profile ? await scanCacheKey(file, opts.size, opts.profile.id).catch(() => null) : null;
  const cached = getCachedScan(key);
  if (cached) {
    log("cache hit", { blocks: cached.blocks.length, ms: since(t0) });
    onProgress({ stage: "Done", progress: 1 });
    return { poster: uploadedPoster(file, url, cached.blocks, cached.aspect, opts.size), blurMode: cached.blurMode, fromCache: true };
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw failWith("not_configured");
  }
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  log("image ready", { width: W, height: H });

  onProgress({ stage: "Loading the OCR engine (about 4 MB, cached after the first run)", progress: P.engine });
  const hooks: ProgressHooks = { onRecognize: null };
  let scheduler: Scheduler | null = null;
  try {
    scheduler = await startScheduler(await loadTesseract(), hooks);

    onProgress({ stage: "Finding text blocks", progress: P.findStart });
    hooks.onRecognize = (p) => onProgress({ stage: "Finding text blocks", progress: P.findStart + p * P.findSpan });
    const page = await recognizeJob(scheduler, canvas);
    hooks.onRecognize = null;

    const lines = (page.blocks ?? [])
      .flatMap((b) => b.paragraphs)
      .flatMap((p) => p.lines)
      .filter((l) => l.confidence >= OCR_MIN_CONFIDENCE && l.text.trim().length >= 2);
    if (lines.length === 0) throw failWith("parse_failure");
    log("first pass ok", { lines: lines.length, ms: since(t0) });

    onProgress({ stage: "Measuring contrast per line", progress: P.contrast });
    const tallest = Math.max(...lines.map((l) => l.bbox.y1 - l.bbox.y0));
    const blocks: PosterBlock[] = lines.slice(0, OCR_MAX_LINES).map((line, i): PosterBlock => {
      const boxH = line.bbox.y1 - line.bbox.y0;
      const text = line.text.trim();
      const label = boxH === tallest ? "Headline" : DATE_PATTERN.test(text) ? "Date or time" : `Text line ${i + 1}`;
      return {
        id: `scan-${i}`,
        label,
        role: boxH === tallest ? "title" : "body",
        text,
        x: (line.bbox.x0 / W) * 100,
        y: (line.bbox.y0 / H) * 100,
        w: ((line.bbox.x1 - line.bbox.x0) / W) * 100,
        h: (boxH / H) * 100,
        capHeightPct: (boxH / H) * 100 * CAP_OF_LINE_BOX,
        weight: 400,
        align: "left",
        tone: "ink",
        contrast: measureContrast(ctx, line.bbox, false),
        deutanContrast: measureContrast(ctx, line.bbox, true),
      };
    });

    let result: ScanResult;
    if (!opts.profile) {
      result = { poster: uploadedPoster(file, url, blocks, W / H, opts.size), confirmError: coreError("not_configured"), fromCache: false };
    } else {
      try {
        const confirmed = await confirmAtDistances(canvas, blocks, opts.size, opts.profile, onProgress, { scheduler });
        setCachedScan(key, { blocks: confirmed.blocks, aspect: W / H, blurMode: confirmed.blurMode });
        result = {
          poster: uploadedPoster(file, url, confirmed.blocks, W / H, opts.size),
          blurMode: confirmed.blurMode,
          fromCache: false,
        };
      } catch (err) {
        const confirmError = toCoreError(err);
        log("confirm failed", { code: confirmError.error });
        result = { poster: uploadedPoster(file, url, blocks, W / H, opts.size), confirmError, fromCache: false };
      }
    }
    onProgress({ stage: "Done", progress: 1 });
    log("scan done", { ms: since(t0) });
    return result;
  } catch (err) {
    URL.revokeObjectURL(url);
    const core = toCoreError(err);
    log("scan failed", { code: core.error });
    throw new CoreFailure(core);
  } finally {
    if (scheduler) await scheduler.terminate().catch(() => undefined);
  }
}
