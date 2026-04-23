"use client";

import { AIReasonLine } from "./AIReasonLine";
import { formatPrice, prettifyType } from "@/lib/format/place";
import { guessCountryCode } from "@/lib/geo/region";
import type { PlaceLite } from "@/lib/places/types";

export function PickCardBody({ pick }: { pick: PlaceLite }) {
  const country = guessCountryCode(pick.location.lat, pick.location.lng);
  const price = formatPrice(pick.priceLevel, country);
  const cleanType = prettifyType(pick.primaryType);
  const walkMin = pick.distanceMeters
    ? Math.max(1, Math.round(pick.distanceMeters / 80))
    : null;

  return (
    <div className="relative px-5 pt-5 pb-5">
      {/* Place name — Shippori Mincho */}
      <h2 className="font-mincho text-[1.7rem] font-medium leading-[1.15] tracking-tight text-sumi-ink text-balance break-keep">
        {pick.name}
      </h2>

      {/* Subtitle: type in mincho with bracket decoration */}
      {cleanType && (
        <p className="mt-1.5 font-mincho text-[12px] text-sumi-mute">
          <span className="text-sumi-fade">《</span>
          {cleanType}
          <span className="text-sumi-fade">》</span>
        </p>
      )}

      {/* Stats row — rating · count · walk · price, all hairline */}
      <div className="mt-3.5 flex items-center gap-3 text-[12px] num-tabular text-sumi-ink">
        {pick.rating !== undefined && (
          <span className="flex items-baseline gap-1.5">
            <span className="font-mincho text-[15px] font-medium">
              {pick.rating.toFixed(1)}
            </span>
            <span aria-hidden className="h-px w-4 bg-sumi-ink/60" />
            {pick.userRatingCount !== undefined && (
              <span className="text-sumi-fade">
                {pick.userRatingCount.toLocaleString()}
              </span>
            )}
          </span>
        )}
        {walkMin !== null && (
          <span className="font-mincho text-sumi-mute">
            徒歩 <span className="text-sumi-ink">{walkMin}</span>分
          </span>
        )}
        {price && (
          <span className="font-mincho text-sumi-ink">{price}</span>
        )}
      </div>

      {/* Hairline before AI line */}
      <div className="hairline-soft mt-4" />

      <AIReasonLine placeId={pick.id} />
    </div>
  );
}
