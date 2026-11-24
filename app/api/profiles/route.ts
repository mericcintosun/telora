import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import type { ApiResponse, VisionProfile } from "@/lib/types";

/** GET /api/profiles: the vision profiles from the active adapter. Read-only. */
export async function GET() {
  const adapter = getAdapter();
  try {
    const profiles = await adapter.listProfiles();
    return NextResponse.json<ApiResponse<VisionProfile[]>>({ ok: true, data: profiles, mode: adapter.mode }, { status: 200 });
  } catch {
    return NextResponse.json<ApiResponse<VisionProfile[]>>({ ok: false, error: "Could not load vision profiles." }, { status: 500 });
  }
}
