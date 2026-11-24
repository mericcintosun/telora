// Error codes for the core path. The UI switches on `error`, never on message text,
// and no raw provider (Tesseract, browser) message is ever passed through to a visitor.

import { MAX_UPLOAD_BYTES } from "./config";

export type CoreErrorCode = "invalid_input" | "upstream_timeout" | "upstream_error" | "parse_failure" | "not_configured";

export interface CoreError {
  error: CoreErrorCode;
  hint: string;
}

const MAX_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

const HINTS: Record<CoreErrorCode, string> = {
  invalid_input: `Telora reads PNG, JPG, WebP and PDF files up to ${MAX_MB} MB, and only the first page of a PDF.`,
  upstream_timeout: "The OCR engine took too long to load or read, so check your connection and try again.",
  upstream_error: "The OCR or PDF engine could not run in this browser, so check your connection and try again.",
  parse_failure: "No readable text was found, or the PDF is damaged or password protected, so try a flat PNG or PDF export.",
  not_configured: "This browser is missing a feature the scan needs, so try a current Chrome, Firefox or Safari.",
};

/** The plain one-sentence hint for a code. */
export function scanErrorHint(code: CoreErrorCode): string {
  return HINTS[code];
}

export function coreError(code: CoreErrorCode, hint: string = scanErrorHint(code)): CoreError {
  return { error: code, hint };
}

/** Thrown on the core path so callers can catch a typed CoreError. */
export class CoreFailure extends Error {
  readonly core: CoreError;
  constructor(core: CoreError) {
    super(core.error);
    this.name = "CoreFailure";
    this.core = core;
  }
}

export function failWith(code: CoreErrorCode): CoreFailure {
  return new CoreFailure(coreError(code));
}

/** Maps anything thrown to a CoreError; unknown errors become upstream_error. */
export function toCoreError(err: unknown): CoreError {
  if (err instanceof CoreFailure) return err.core;
  return coreError("upstream_error");
}
