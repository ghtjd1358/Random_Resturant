import { NextResponse } from "next/server";
import { z } from "zod";
import {
  searchDistributed,
  subSearchCount,
  PlacesApiError,
} from "@/lib/places/client";
import { withCache } from "@/lib/cache/runtime";
import { consumeDailyQuota, RateLimitExceeded } from "@/lib/rate-limit";
import type { NearbyResponse } from "@/lib/places/types";

export const runtime = "nodejs";
export const maxDuration = 10;

const BodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().int().min(100).max(5000),
  category: z.enum(["food", "cafe"]),
  subcategory: z.string().optional(),
  openNowOnly: z.boolean().optional(),
  regionCode: z.string().length(2).optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: err instanceof Error ? err.message : null },
      { status: 400 },
    );
  }

  const { lat, lng, radius, category, subcategory, regionCode } = parsed;
  // Quantize coordinates to ~110m grid for cache key stability
  const key = `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radius}:${category}:${subcategory ?? "all"}:${regionCode ?? "auto"}`;

  try {
    const places = await withCache(
      key,
      600, // 10 minutes — matches client TTL so cache hits stay aligned
      async () => {
        // searchDistributed runs N sub-searches based on radius (see
        // subSearchCount). Charge quota proportionally so budgets reflect
        // actual API cost.
        const calls = subSearchCount(radius);
        for (let i = 0; i < calls; i++) {
          await consumeDailyQuota("places-nearby");
        }
        return searchDistributed({
          lat,
          lng,
          radius,
          category,
          subcategory: subcategory as never,
          regionCode,
        });
      },
    );
    const body: NearbyResponse = { places, cachedAt: Date.now() };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=240",
      },
    });
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      return NextResponse.json(
        {
          error: "daily_limit_reached",
          message: "오늘의 추천 한도(500번)를 다 썼어요. 내일 다시 뽑아주세요.",
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
