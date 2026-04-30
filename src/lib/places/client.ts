import "server-only";
import type {
  Category,
  PlaceLite,
  PlaceDetails,
  PlaceReview,
  Subcategory,
} from "./types";
import { findSubcategory } from "./types";
import { haversine } from "@/lib/geo/haversine";

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const DETAILS_URL = (id: string) =>
  `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;

// Minimal field masks — each field affects pricing tier (Essentials/Pro/Enterprise)
// https://developers.google.com/maps/documentation/places/web-service/nearby-search#fieldmask
const NEARBY_FIELDS = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
  "places.googleMapsUri",
  "places.currentOpeningHours.openNow",
].join(",");

const DETAILS_FIELDS = [
  "id",
  "displayName",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "primaryType",
  "googleMapsUri",
  "formattedAddress",
  "editorialSummary",
  "reviews",
  "photos",
  "regularOpeningHours",
  "currentOpeningHours",
].join(",");

const CATEGORY_TYPES: Record<Category, string[]> = {
  food: ["restaurant", "meal_takeaway", "meal_delivery"],
  cafe: ["cafe", "bakery", "coffee_shop"],
  bar: ["bar", "pub", "wine_bar", "night_club"],
};

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  return key;
}

// Google returns displayName as { text, languageCode }
function normalizeDisplayName(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "text" in v) {
    return String((v as { text?: string }).text ?? "");
  }
  return "";
}

interface RawPlace {
  id: string;
  displayName?: { text: string } | string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType?: string;
  googleMapsUri?: string;
  currentOpeningHours?: { openNow?: boolean };
}

function toPlaceLite(raw: RawPlace): PlaceLite {
  return {
    id: raw.id,
    name: normalizeDisplayName(raw.displayName),
    rating: raw.rating,
    userRatingCount: raw.userRatingCount,
    priceLevel: raw.priceLevel as PlaceLite["priceLevel"],
    primaryType: raw.primaryType,
    googleMapsUri: raw.googleMapsUri,
    openNow: raw.currentOpeningHours?.openNow,
    location: {
      lat: raw.location?.latitude ?? 0,
      lng: raw.location?.longitude ?? 0,
    },
  };
}

export async function searchNearby(params: {
  lat: number;
  lng: number;
  radius: number;
  category: Category;
  subcategory?: Subcategory;
  /** ISO-3166-1 alpha-2, e.g. "JP", "FR". Drives Google's locality ranking. */
  regionCode?: string;
}): Promise<PlaceLite[]> {
  const { lat, lng, radius, category, subcategory, regionCode } = params;

  // Resolve includedTypes: subcategory override > category defaults.
  const subDef = subcategory ? findSubcategory(subcategory) : undefined;
  const includedTypes =
    subDef && subDef.includedTypes.length > 0
      ? subDef.includedTypes
      : CATEGORY_TYPES[category];

  // POPULARITY ranking within a small sub-radius. We use multiple
  // geographically-offset sub-searches (see searchDistributed) to achieve
  // real spread across the user's full radius instead of clustering near
  // the center.
  const body: Record<string, unknown> = {
    includedTypes,
    maxResultCount: 20,
    rankPreference: "POPULARITY",
    languageCode: "ko",
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(50000, Math.max(50, radius)),
      },
    },
  };
  // Only include regionCode when we know it — Google treats missing vs.
  // mismatched values differently; "unknown" gives more natural global results
  // than a wrong pin.
  if (regionCode) body.regionCode = regionCode;

  const res = await fetch(NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": NEARBY_FIELDS,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PlacesApiError(
      `Nearby Search failed: ${res.status} ${text}`,
      res.status,
    );
  }

  const data = (await res.json()) as { places?: RawPlace[] };
  return (data.places ?? []).map(toPlaceLite);
}

interface RawReview {
  text?: { text?: string; languageCode?: string };
  rating?: number;
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string };
}

interface RawDetails extends RawPlace {
  formattedAddress?: string;
  editorialSummary?: { text?: string };
  reviews?: RawReview[];
  photos?: { name?: string; widthPx?: number; heightPx?: number }[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  currentOpeningHours?: { openNow?: boolean };
}

export async function getPlaceDetails(id: string): Promise<PlaceDetails> {
  const res = await fetch(DETAILS_URL(id), {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": DETAILS_FIELDS,
      "Accept-Language": "ko",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PlacesApiError(
      `Place Details failed: ${res.status} ${text}`,
      res.status,
    );
  }

  const raw = (await res.json()) as RawDetails;
  const lite = toPlaceLite(raw);

  const reviews: PlaceReview[] = (raw.reviews ?? [])
    .map((r) => ({
      text: r.text?.text ?? "",
      rating: r.rating,
      relativeTime: r.relativePublishTimeDescription,
      authorName: r.authorAttribution?.displayName,
    }))
    .filter((r) => r.text.length > 0);

  return {
    ...lite,
    formattedAddress: raw.formattedAddress,
    editorialSummary: raw.editorialSummary?.text,
    reviews,
    photos: (raw.photos ?? []).map((p) => ({
      reference: p.name ?? "",
      widthPx: p.widthPx ?? 0,
      heightPx: p.heightPx ?? 0,
    })),
    openingHours: raw.regularOpeningHours
      ? {
          openNow: raw.currentOpeningHours?.openNow,
          weekdayDescriptions: raw.regularOpeningHours.weekdayDescriptions,
        }
      : undefined,
  };
}

export class PlacesApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "PlacesApiError";
  }
}

/* ------------------------------------------------------------------------ */
/*  Distributed (multi-center) search — fixes "radius doesn't matter" bug   */
/* ------------------------------------------------------------------------ */

/**
 * Offset a lat/lng by a distance (meters) along a bearing (radians).
 * Great-circle formula — accurate enough at our scale (< 3km).
 */
function offsetCoord(
  lat: number,
  lng: number,
  bearing: number,
  distanceMeters: number,
): { lat: number; lng: number } {
  const R = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const d = distanceMeters / R;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(d) +
      Math.cos(latRad) * Math.sin(d) * Math.cos(bearing),
  );
  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
      Math.cos(d) - Math.sin(latRad) * Math.sin(newLatRad),
    );

  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}

/**
 * How many sub-searches to run for a given radius. Each sub-search is one
 * Places API call (≈$0.032) and returns up to 20 candidates. The route
 * handler reads this same function to charge quota, so callers stay in sync.
 *
 * Tuning history: original 1/2/3 (≤500/≤1200/>1200) gave 20/40/60 raw
 * candidates → 18/30/40 after dedupe in dense areas. Users hit "나왔던 게
 * 또 나오네" since the new Places API (New) has no nextPageToken so we can't
 * fetch a true page 2. Bumped to 2/3/5 to grow the pool ~2× — still cheap
 * relative to monthly free credit.
 */
export function subSearchCount(radius: number): number {
  if (radius <= 500) return 2;
  if (radius < 1200) return 3;
  return 5;
}

/**
 * Multi-center Nearby Search that actually respects the user's radius.
 *
 * Why: Places API caps results at 20 per call AND the New API removed
 * pagination via nextPageToken — so the only way to grow the candidate pool
 * is more sub-searches at offset centers. In dense urban areas a single
 * search at the user's location returns the 20 most popular near the center,
 * regardless of whether they set 500m or 2km.
 *
 * How: We run N parallel searches at geometrically distributed centers
 * (see subSearchCount), each with a smaller sub-radius. We then merge,
 * dedupe by place id, and clip to the user's declared radius.
 *
 * Cost: 2~5× API calls per roll. Small radii get 2 micro-offset centers
 * for variety even at 500m. Cheap on $200 monthly free credit.
 */
export async function searchDistributed(params: {
  lat: number;
  lng: number;
  radius: number;
  category: Category;
  subcategory?: Subcategory;
  regionCode?: string;
}): Promise<PlaceLite[]> {
  const { lat, lng, radius } = params;

  const numCenters = subSearchCount(radius);

  // Fixed geometry (not random) so cache hits work across re-rolls.
  // - 2 centers: tight micro-offset for small radii (~30% offset)
  // - 3 centers: triangle (0°/120°/240°) at ~55% offset
  // - 5 centers: pentagon (0°/72°/144°/216°/288°) at ~55% offset
  let bearings: number[];
  let offsetFraction: number;
  let subRadiusFraction: number;
  if (numCenters === 2) {
    bearings = [Math.PI / 4, Math.PI + Math.PI / 4];
    offsetFraction = 0.3;
    subRadiusFraction = 0.85;
  } else if (numCenters === 3) {
    bearings = [Math.PI / 6, Math.PI / 6 + (2 * Math.PI) / 3, Math.PI / 6 + (4 * Math.PI) / 3];
    offsetFraction = 0.55;
    subRadiusFraction = 0.65;
  } else {
    // 5 centers: 1 at center + 4 at corners-ish for large radii.
    bearings = Array.from({ length: 4 }, (_, i) => (i * 2 * Math.PI) / 4 + Math.PI / 8);
    offsetFraction = 0.6;
    subRadiusFraction = 0.55;
  }

  const offsetDistance = radius * offsetFraction;
  const subRadius = Math.round(radius * subRadiusFraction);

  const centers =
    numCenters === 5
      ? [
          { lat, lng },
          ...bearings.map((b) => offsetCoord(lat, lng, b, offsetDistance)),
        ]
      : bearings.map((b) => offsetCoord(lat, lng, b, offsetDistance));

  const results = await Promise.all(
    centers.map((c) =>
      searchNearby({
        lat: c.lat,
        lng: c.lng,
        radius: subRadius,
        category: params.category,
        subcategory: params.subcategory,
        regionCode: params.regionCode,
      }).catch(() => [] as PlaceLite[]),
    ),
  );

  // Dedupe by place id, preserving first occurrence order.
  const seen = new Set<string>();
  const merged: PlaceLite[] = [];
  for (const list of results) {
    for (const p of list) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      merged.push(p);
    }
  }

  // Clip strictly to the user's radius — sub-searches can bleed outside.
  const origin = { lat, lng };
  return merged.filter((p) => haversine(origin, p.location) <= radius);
}
