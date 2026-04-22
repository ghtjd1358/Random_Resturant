"use client";

import { ExternalLink, MapPin } from "lucide-react";
import { AIReasonLine } from "./AIReasonLine";
import { RatingBadge } from "@/components/common/RatingBadge";
import { DistanceBadge } from "@/components/common/DistanceBadge";
import { OpenNowBadge } from "@/components/common/OpenNowBadge";
import { formatPrice, prettifyType } from "@/lib/format/place";
import { guessCountryCode } from "@/lib/geo/region";
import type { PlaceLite } from "@/lib/places/types";

export function PickCardBody({ pick }: { pick: PlaceLite }) {
  // Use the pick's own coordinates so currency always matches the place,
  // not the user's GPS. Seoul user browsing Tokyo presets still sees ¥.
  const country = guessCountryCode(pick.location.lat, pick.location.lng);
  const price = formatPrice(pick.priceLevel, country);
  const cleanType = prettifyType(pick.primaryType);

  return (
    <div className="relative px-5 pt-6 pb-4">
      {/* Metadata row (type · price · open status) */}
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {cleanType && <span>{cleanType}</span>}
        {cleanType && price && <Dot />}
        {price && <span className="text-matcha-deep">{price}</span>}
        {pick.openNow !== undefined && (
          <>
            <Dot />
            <OpenNowBadge open={pick.openNow} />
          </>
        )}
      </div>

      {/* Place name — big, handwritten, with brush-stroke underline on first char */}
      <h2 className="font-heading text-[1.75rem] font-bold leading-[1.1] tracking-tight text-sumi text-balance break-keep">
        {pick.name}
      </h2>

      {/* Thin brush rule */}
      <div
        aria-hidden
        className="mt-3 h-px w-12"
        style={{
          background:
            "linear-gradient(90deg, rgba(43,43,43,0.45), rgba(43,43,43,0))",
        }}
      />

      {/* Rating · distance */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <RatingBadge rating={pick.rating} count={pick.userRatingCount} />
        <DistanceBadge meters={pick.distanceMeters} />
      </div>

      <AIReasonLine placeId={pick.id} />

      {pick.googleMapsUri && (
        <a
          href={pick.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-matcha-deep underline-offset-4 hover:underline"
        >
          <MapPin className="size-3" />
          구글맵에서 보기
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="size-[3px] rounded-full bg-muted-foreground/40" />
  );
}
