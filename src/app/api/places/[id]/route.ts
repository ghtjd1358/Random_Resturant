import { NextResponse } from "next/server";
import { getPlaceDetails, PlacesApiError } from "@/lib/places/client";
import { withCache } from "@/lib/cache/runtime";
import { consumeDailyQuota, RateLimitExceeded } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    const details = await withCache(
      `place:${id}`,
      60 * 60 * 24, // 24 hours
      async () => {
        await consumeDailyQuota("places-details");
        return getPlaceDetails(id);
      },
    );
    return NextResponse.json(details, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=1800",
      },
    });
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      return NextResponse.json(
        {
          error: "daily_limit_reached",
          resetAtMs: err.resetAtMs,
        },
        { status: 429 },
      );
    }
    if (err instanceof PlacesApiError) {
      const retryAfterMs = err.status === 429 ? 60_000 : 5_000;
      return NextResponse.json(
        { error: "places_api_error", status: err.status, retryAfterMs },
        { status: err.status === 429 ? 429 : 502 },
      );
    }
    return NextResponse.json(
      { error: "server_error", message: err instanceof Error ? err.message : null },
      { status: 500 },
    );
  }
}
