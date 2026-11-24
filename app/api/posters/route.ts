import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, PosterRecord } from "@/lib/types";

/** GET /api/posters: the example posters from the active adapter. Read-only. */
export async function GET() {
  const adapter = getAdapter();
  try {
    const posters = await adapter.listPosters();
    return NextResponse.json<ApiResponse<PosterRecord[]>>({ ok: true, data: posters, mode: adapter.mode }, { status: 200 });
  } catch {
    return NextResponse.json<ApiResponse<PosterRecord[]>>({ ok: false, error: "Could not load posters." }, { status: 500 });
  }
}
