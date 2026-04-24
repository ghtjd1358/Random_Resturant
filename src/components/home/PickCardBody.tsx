"use client";

import { AIReasonLine } from "./AIReasonLine";
import { formatPrice, prettifyType } from "@/lib/format/place";
import type { PlaceLite } from "@/lib/places/types";

export function PickCardBody({ pick }: { pick: PlaceLite }) {
  // Force JP/¥ for price — every recommended place is in Japan, so the
  // GPS-derived currency would just confuse non-traveling users by flipping
  // between ₩/$/¥ depending on where they currently stand.
  const price = formatPrice(pick.priceLevel, "JP");
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

      {/* Stats row — explicit Korean labels so 4.6 / 1,275 / 6 / ¥¥ aren't
          mistaken for distance or random numbers. */}
      <div className="mt-3.5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-[12px] num-tabular text-sumi-ink">
        {pick.rating !== undefined && (
          <Stat
            label="평점"
            value={
              <>
                <span className="text-shu">★</span>{" "}
                <span className="font-mincho text-[14px] font-medium">
                  {pick.rating.toFixed(1)}
                </span>
                {pick.userRatingCount !== undefined && (
                  <span className="ml-1 text-sumi-fade">
                    · 리뷰 {pick.userRatingCount.toLocaleString()}
                  </span>
                )}
              </>
            }
          />
        )}
        {walkMin !== null && (
          <Stat
            label="거리"
            value={
              <span className="font-mincho">
                도보 <span className="text-sumi-ink">{walkMin}</span>분
              </span>
            }
          />
        )}
        {price && (
          <Stat
            label="가격"
            value={<span className="font-mincho text-sumi-ink">{price}</span>}
          />
        )}
      </div>

      {/* Hairline before AI line */}
      <div className="hairline-soft mt-4" />

      {/* Reserved slot for the AI line — min-height locks card size BEFORE
          the AI box mounts. Without this, the card grew once when the
          green box appeared and again when text/disclaimer rendered, which
          shook the whole page. Now the card is steady from first paint and
          the AI box just fades into existing space. */}
      <div className="mt-3.5 min-h-[78px]">
        <AIReasonLine placeId={pick.id} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="eyebrow text-[9px]">{label}</span>
      <span className="text-sumi-ink">{value}</span>
    </span>
  );
}
