import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { coreError, toCoreError } from "@/lib/errors";
import { ApiIdSchema } from "@/lib/schemas";
import type { ApiResponse, PosterRecord } from "@/lib/types";

/**
 * GET /api/posters: the example posters from the active adapter. Read-only.
 * GET /api/posters?id=robot-sumo-night: one poster. A malformed id is 400, an unknown id 404,
 * an adapter failure 502. Error bodies carry a code from lib/errors.ts.
 */
export async function GET(request: Request) {
  const adapter = getAdapter();
  const rawId = new URL(request.url).searchParams.get("id");

  if (rawId === null) {
    try {
      const posters = await adapter.listPosters();
      return NextResponse.json<ApiResponse<PosterRecord[]>>({ ok: true, data: posters, mode: adapter.mode }, { status: 200 });
    } catch (err) {
      return NextResponse.json<ApiResponse<PosterRecord[]>>({ ok: false, ...toCoreError(err) }, { status: 502 });
    }
  }

  const id = ApiIdSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json<ApiResponse<PosterRecord>>({ ok: false, ...coreError("invalid_input", "The id must be lowercase letters, digits and hyphens.") }, { status: 400 });
  }
  try {
    const poster = await adapter.getPoster(id.data);
    if (!poster) {
      return NextResponse.json<ApiResponse<PosterRecord>>({ ok: false, ...coreError("invalid_input", "No poster has this id.") }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<PosterRecord>>({ ok: true, data: poster, mode: adapter.mode }, { status: 200 });
  } catch (err) {
    return NextResponse.json<ApiResponse<PosterRecord>>({ ok: false, ...toCoreError(err) }, { status: 502 });
  }
}
