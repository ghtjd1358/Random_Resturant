import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReason } from "@/lib/ai/reason";
import { getPlaceDetails } from "@/lib/places/client";
import { withCache } from "@/lib/cache/runtime";
import { consumeDailyQuota, RateLimitExceeded } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 15;

const BodySchema = z.object({
  placeId: z.string().min(1),
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

  const { placeId } = parsed;

  try {
    // Cache the final reason for 24h so re-rolls to the same place reuse it.
    const reason = await withCache(`reason:${placeId}`, 60 * 60 * 24, async () => {
      const details = await withCache(
        `place:${placeId}`,
        60 * 60 * 24,
        async () => {
          await consumeDailyQuota("places-details");
          return getPlaceDetails(placeId);
        },
      );

      const reviewTexts = details.reviews.map((r) => r.text).filter(Boolean);

      if (reviewTexts.length === 0) {
        // Fall back to a rule-based string when there's nothing to ground on.
        if (details.rating && details.userRatingCount) {
          return `평점 ${details.rating.toFixed(1)}, 리뷰 ${details.userRatingCount.toLocaleString()}개의 현지 인기 가게`;
        }
        return "현지에서 꾸준히 방문하는 가게";
      }

      await consumeDailyQuota("ai-reason");
      return generateReason({
        name: details.name,
        primaryType: details.primaryType,
        rating: details.rating,
        userRatingCount: details.userRatingCount,
        reviewTexts,
      });
    });

    return NextResponse.json(
      { reason },
      {
        headers: {
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      return NextResponse.json(
        { error: "daily_limit_reached", resetAtMs: err.resetAtMs },
        { status: 429 },
      );
    }
    console.error("[ai/reason]", err);
    return NextResponse.json(
      {
        error: "reason_generation_failed",
        message: err instanceof Error ? err.message : null,
      },
      { status: 500 },
    );
  }
}
