// zod schemas for the core path: the upload check and the OCR result shapes.
// Relative imports so tsx (tests, scripts) resolves them without a path alias.

import { z } from "zod";
import { MAX_UPLOAD_BYTES, UPLOAD_TYPES } from "./config";
import { MAX_DISTANCE_M, MIN_DISTANCE_M, SCAN_DISTANCES_M } from "./legibility";

/** Parse `{ type: file.type, size: file.size }` before any scan logic runs. */
export const UploadFileSchema = z.object({
  type: z.enum(UPLOAD_TYPES),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export const PaperSizeSchema = z.enum(["A3", "A2", "A1", "A0"]);
export const ProfileIdSchema = z.enum(["2020", "2040", "lowcontrast", "deutan"]);

export const BlockOcrSchema = z
  .object({
    maxDistanceM: z.number().min(0),
    matchByDistance: z.array(z.number().min(0).max(1)).length(SCAN_DISTANCES_M.length),
    size: PaperSizeSchema,
    profileId: ProfileIdSchema,
    basis: z.enum(["live", "sample"]),
  })
  .refine((o) => o.maxDistanceM === 0 || SCAN_DISTANCES_M.includes(o.maxDistanceM), {
    message: "maxDistanceM must be 0 or one of the 8 scan distances",
    path: ["maxDistanceM"],
  });

/** Sample OCR results keyed by seed block id. */
export const OcrSamplesSchema = z.record(z.string(), BlockOcrSchema);

/**
 * Shareable lab state from the URL (`/?poster=&size=&d=&profile=`). Every field falls back
 * to undefined on bad input, so a broken link never errors; the page then picks its defaults.
 * `d` is clamped to MIN_DISTANCE_M..MAX_DISTANCE_M.
 */
export const LabParamsSchema = z.object({
  poster: z.string().min(1).max(80).optional().catch(undefined),
  size: PaperSizeSchema.optional().catch(undefined),
  d: z.coerce
    .number()
    .finite()
    .positive()
    .transform((v) => Math.min(MAX_DISTANCE_M, Math.max(MIN_DISTANCE_M, v)))
    .optional()
    .catch(undefined),
  profile: ProfileIdSchema.optional().catch(undefined),
});

/** `?id=` on the read-only API routes. */
export const ApiIdSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);

export type UploadFileInput = z.infer<typeof UploadFileSchema>;
export type LabParams = z.infer<typeof LabParamsSchema>;
