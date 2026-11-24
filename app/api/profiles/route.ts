import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapter";
import { coreError, toCoreError } from "@/lib/errors";
import { ApiIdSchema } from "@/lib/schemas";
import type { ApiResponse, VisionProfile } from "@/lib/types";

/**
 * GET /api/profiles: the vision profiles from the active adapter. Read-only.
 * GET /api/profiles?id=2040: one profile. A malformed id is 400, an unknown id 404,
 * an adapter failure 502. Error bodies carry a code from lib/errors.ts.
 */
export async function GET(request: Request) {
  const adapter = getAdapter();
  const rawId = new URL(request.url).searchParams.get("id");

  if (rawId === null) {
    try {
      const profiles = await adapter.listProfiles();
      return NextResponse.json<ApiResponse<VisionProfile[]>>({ ok: true, data: profiles, mode: adapter.mode }, { status: 200 });
    } catch (err) {
      return NextResponse.json<ApiResponse<VisionProfile[]>>({ ok: false, ...toCoreError(err) }, { status: 502 });
    }
  }

  const id = ApiIdSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json<ApiResponse<VisionProfile>>({ ok: false, ...coreError("invalid_input", "The id must be lowercase letters, digits and hyphens.") }, { status: 400 });
  }
  try {
    const profile = await adapter.getProfile(id.data);
    if (!profile) {
      return NextResponse.json<ApiResponse<VisionProfile>>({ ok: false, ...coreError("invalid_input", "No vision profile has this id.") }, { status: 404 });
    }
    return NextResponse.json<ApiResponse<VisionProfile>>({ ok: true, data: profile, mode: adapter.mode }, { status: 200 });
  } catch (err) {
    return NextResponse.json<ApiResponse<VisionProfile>>({ ok: false, ...toCoreError(err) }, { status: 502 });
  }
}
