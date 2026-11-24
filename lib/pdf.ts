// PDF entry point for the upload scan. Browser only: call it from a "use client" path.
// pdfjs-dist is imported dynamically inside renderFirstPage, never at module top level, so
// neither the server bundle nor the first page load pays for it.
//
// Failures map to CoreFailure codes from lib/errors.ts:
// - damaged, empty or password-protected PDF: parse_failure
// - no 2D canvas in this browser: not_configured
// - the pdf.js worker fails to load: one retry (PDF_WORKER_RETRIES), then upstream_error

import { CORE_LOG_PREFIX, PDF_WORKER_RETRIES } from "./config";
import { CoreFailure, failWith } from "./errors";

type PdfJs = typeof import("pdfjs-dist");

/** pdf.js error names that mean the file itself cannot be read. */
const FILE_ERRORS = new Set(["PasswordException", "InvalidPDFException", "MissingPDFException", "FormatError", "UnexpectedResponseException"]);

function errorName(err: unknown): string {
  return err && typeof err === "object" && "name" in err && typeof (err as { name: unknown }).name === "string"
    ? (err as { name: string }).name
    : "";
}

function errorMessage(err: unknown): string {
  return err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
    ? (err as { message: string }).message
    : "";
}

function isWorkerFailure(err: unknown): boolean {
  return !FILE_ERRORS.has(errorName(err)) && /worker/i.test(errorMessage(err));
}

let pdfjsPromise: Promise<PdfJs> | null = null;

async function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist")
      .then((mod) => {
        const withDefault = mod as unknown as { default?: PdfJs };
        const lib = withDefault.default?.getDocument ? withDefault.default : (mod as unknown as PdfJs);
        lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        return lib;
      })
      .catch((err: unknown) => {
        pdfjsPromise = null;
        throw err;
      });
  }
  try {
    return await pdfjsPromise;
  } catch {
    throw failWith("upstream_error");
  }
}

async function renderOnce(pdfjs: PdfJs, bytes: Uint8Array, longEdgePx: number): Promise<HTMLCanvasElement> {
  // pdf.js may transfer the buffer to its worker, so hand it a copy each attempt.
  const task = pdfjs.getDocument({ data: bytes.slice() });
  try {
    const doc = await task.promise;
    if (doc.numPages < 1) throw failWith("parse_failure");
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = longEdgePx / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw failWith("not_configured");
    // White first, so a transparent page reads as dark on white for Tesseract.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pdf.js 5 moved from `canvasContext` to `canvas` across minor versions; pass both.
    const params = { canvasContext: ctx, canvas, viewport } as unknown as Parameters<typeof page.render>[0];
    await page.render(params).promise;
    page.cleanup();
    return canvas;
  } finally {
    void task.destroy().catch(() => undefined);
  }
}

/**
 * Renders page 1 of a PDF to a canvas whose long edge is `longEdgePx` (OCR_LONG_EDGE_PX on the
 * scan path). Throws CoreFailure with parse_failure, not_configured or upstream_error.
 */
export async function renderFirstPage(file: File, longEdgePx: number): Promise<HTMLCanvasElement> {
  if (typeof document === "undefined") throw failWith("not_configured");
  const t0 = performance.now();
  const pdfjs = await loadPdfJs();
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw failWith("parse_failure");
  }

  const toCore = (err: unknown): CoreFailure =>
    err instanceof CoreFailure ? err : isWorkerFailure(err) ? failWith("upstream_error") : failWith("parse_failure");

  let canvas: HTMLCanvasElement;
  try {
    canvas = await renderOnce(pdfjs, bytes, longEdgePx);
  } catch (first) {
    // Exactly one retry, and only when the worker failed to load; a bad file fails at once.
    if (first instanceof CoreFailure || !isWorkerFailure(first) || PDF_WORKER_RETRIES < 1) throw toCore(first);
    console.info(`${CORE_LOG_PREFIX} pdf worker retry`);
    try {
      canvas = await renderOnce(pdfjs, bytes, longEdgePx);
    } catch (second) {
      throw toCore(second);
    }
  }
  console.info(`${CORE_LOG_PREFIX} pdf page ready`, { width: canvas.width, height: canvas.height, ms: Math.round(performance.now() - t0) });
  return canvas;
}
