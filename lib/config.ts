// Every constant on Telora's core path (upload check, OCR scan, 8-distance confirmation).
// This module reads no environment variable and holds no secret, so client components,
// tests and scripts can import it freely.

/** A line counts as readable at a distance while at least this share of its words still match. */
export const OCR_PASS_RATIO = 0.6;
/** Tesseract workers in the scheduler. Two lets the 8 blurred re-reads run in parallel. */
export const OCR_WORKERS = 2;
/** The uploaded image is scaled so its long edge is at most this many pixels before OCR. */
export const OCR_LONG_EDGE_PX = 1600;
/** First-pass lines below this Tesseract confidence (0 to 100) are dropped. */
export const OCR_MIN_CONFIDENCE = 55;
/** Most text lines the first pass keeps for the report. */
export const OCR_MAX_LINES = 16;
/** Creating a worker downloads the engine and English data (about 4 MB) on the first run. */
export const OCR_LOAD_TIMEOUT_MS = 45_000;
/** One recognize job on one image. */
export const OCR_JOB_TIMEOUT_MS = 60_000;
/** Retries after a failed or timed-out worker load. Exactly one, never a loop. */
export const OCR_RETRIES = 1;
/** Padding (percent of poster width or height) around a block box when assigning words to it. */
export const OCR_BLOCK_PAD_PCT = 0.6;
/** Downscale blur fallback (no ctx.filter): shrink by this many pixels per pixel of sigma. */
export const OCR_DOWNSCALE_PER_SIGMA = 2;
/** The OCR result agrees with the model when it reaches at least this share of the model distance. */
export const OCR_AGREE_RATIO = 0.85;

/** A text line's box runs from ascender to descender; capitals fill about this share of it. */
export const CAP_OF_LINE_BOX = 0.62;
/** Machado, Oliveira and Fernandes (2009) deuteranopia matrix, severity 1, row-major on linear RGB. */
export const DEUTAN_MATRIX = [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881] as const;

/** Largest upload the scan accepts. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Prefix for every core-path log line. Logs carry ids, counts and durations only, never poster text. */
export const CORE_LOG_PREFIX = "[core]";
