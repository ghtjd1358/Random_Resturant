import {
  levelToBucket,
  priceTierFor,
  type Category,
  type PriceLevel,
} from "@/lib/places/types";

export function formatPrice(
  level?: PriceLevel | string,
  countryCode?: string | null,
): string {
  const b = levelToBucket(level as never);
  if (!b) return "";
  return priceTierFor(b, countryCode);
}

export function formatDistance(m?: number): string {
  if (m == null) return "";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function formatWalkTime(m?: number): string {
  if (m == null) return "";
  const mins = Math.max(1, Math.round(m / 80));
  return `도보 ${mins}분`;
}

export function prettifyType(t?: string): string {
  if (!t) return "";
  return t
    .replace(/_/g, " ")
    .replace(/\bRestaurant\b/i, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Big decorative emoji for a place based on its Google primary type. */
export function decorEmojiFor(primaryType?: string, category?: Category): string {
  const t = primaryType?.toLowerCase() ?? "";
  if (t.includes("ramen")) return "🍜";
  if (t.includes("sushi")) return "🍣";
  if (t.includes("bakery")) return "🥐";
  if (t.includes("coffee") || t.includes("cafe")) return "☕";
  if (t.includes("ice_cream")) return "🍦";
  if (t.includes("steak") || t.includes("barbecue")) return "🥩";
  if (t.includes("seafood")) return "🦐";
  if (t.includes("pizza")) return "🍕";
  if (t.includes("hamburger") || t.includes("fast_food")) return "🍔";
  if (t.includes("wine_bar")) return "🍷";
  if (t.includes("night_club")) return "🪩";
  if (t.includes("pub")) return "🍺";
  if (t.includes("bar") || t.includes("izakaya")) return "🍶";
  if (t.includes("italian")) return "🍝";
  if (t.includes("korean")) return "🍚";
  if (t.includes("japanese")) return "🍱";
  if (t.includes("chinese")) return "🥟";
  if (category === "bar") return "🍶";
  return category === "cafe" ? "☕" : "🍽️";
}
