export type Category = "food" | "cafe";

/** Fine-grained subcategories mapped to Google Places API `includedTypes`. */
export type Subcategory =
  // food
  | "all-food"
  | "ramen"
  | "sushi"
  | "japanese"
  | "izakaya"
  | "steak"
  | "seafood"
  | "fastfood"
  // cafe
  | "all-cafe"
  | "coffee"
  | "dessert"
  | "bakery";

export interface SubcategoryDef {
  key: Subcategory;
  label: string;
  emoji: string;
  /** Google Places API (New) includedTypes. Empty = use parent category defaults. */
  includedTypes: string[];
}

export const FOOD_SUBCATEGORIES: SubcategoryDef[] = [
  { key: "all-food", label: "전체", emoji: "🍽️", includedTypes: [] },
  { key: "ramen", label: "라멘", emoji: "🍜", includedTypes: ["ramen_restaurant"] },
  { key: "sushi", label: "스시", emoji: "🍣", includedTypes: ["sushi_restaurant"] },
  { key: "japanese", label: "일식", emoji: "🍱", includedTypes: ["japanese_restaurant"] },
  { key: "izakaya", label: "이자카야", emoji: "🍶", includedTypes: ["bar"] },
  { key: "steak", label: "스테이크/야키니쿠", emoji: "🥩", includedTypes: ["steak_house", "barbecue_restaurant"] },
  { key: "seafood", label: "해산물", emoji: "🦐", includedTypes: ["seafood_restaurant"] },
  { key: "fastfood", label: "패스트푸드", emoji: "🍔", includedTypes: ["fast_food_restaurant", "hamburger_restaurant"] },
];

export const CAFE_SUBCATEGORIES: SubcategoryDef[] = [
  { key: "all-cafe", label: "전체", emoji: "☕", includedTypes: [] },
  { key: "coffee", label: "커피", emoji: "☕", includedTypes: ["coffee_shop", "cafe"] },
  { key: "dessert", label: "디저트", emoji: "🍰", includedTypes: ["ice_cream_shop"] },
  { key: "bakery", label: "베이커리", emoji: "🥐", includedTypes: ["bakery"] },
];

export function subcategoriesFor(c: Category): SubcategoryDef[] {
  return c === "food" ? FOOD_SUBCATEGORIES : CAFE_SUBCATEGORIES;
}

export function findSubcategory(key: Subcategory): SubcategoryDef | undefined {
  return [...FOOD_SUBCATEGORIES, ...CAFE_SUBCATEGORIES].find((s) => s.key === key);
}

export type PriceLevel =
  | "PRICE_LEVEL_UNSPECIFIED"
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";

/** User-facing price bucket. "any" means no filtering. */
export type PriceBucket = "¥" | "¥¥" | "¥¥¥" | "¥¥¥¥";

export interface PriceBucketDef {
  key: PriceBucket;
  label: string;
  level: PriceLevel;
  /** Short one-word label shown under the ¥ symbol in buttons. */
  description: string;
  /** Approximate per-meal range in Japan. Used in the price guide sheet. */
  approxRange: string;
  /** Longer explanation shown in the price guide sheet. */
  longDescription: string;
}

export const PRICE_BUCKETS: PriceBucketDef[] = [
  {
    key: "¥",
    label: "¥",
    level: "PRICE_LEVEL_INEXPENSIVE",
    description: "저렴",
    approxRange: "~1,500엔",
    longDescription:
      "서민식당·체인점·동네 라멘집. 가볍게 한 끼 하기 좋은 가격대입니다.",
  },
  {
    key: "¥¥",
    label: "¥¥",
    level: "PRICE_LEVEL_MODERATE",
    description: "보통",
    approxRange: "1,500~4,000엔",
    longDescription:
      "일반 식당·이자카야·동네 스시집. 여행 중 가장 흔하게 만나는 가격대예요.",
  },
  {
    key: "¥¥¥",
    label: "¥¥¥",
    level: "PRICE_LEVEL_EXPENSIVE",
    description: "비쌈",
    approxRange: "4,000~10,000엔",
    longDescription:
      "중상급 식당·코스요리·야키니쿠·스테이크. 기념일이나 제대로 먹고 싶은 날에.",
  },
  {
    key: "¥¥¥¥",
    label: "¥¥¥¥",
    level: "PRICE_LEVEL_VERY_EXPENSIVE",
    description: "최고급",
    approxRange: "10,000엔+",
    longDescription:
      "오마카세·가이세키·미슐랭 레스토랑. 예산은 넉넉하게, 예약은 필수입니다.",
  },
];

export function bucketToLevel(b: PriceBucket): PriceLevel {
  return PRICE_BUCKETS.find((p) => p.key === b)!.level;
}

export function levelToBucket(l?: PriceLevel): PriceBucket | null {
  const found = PRICE_BUCKETS.find((p) => p.level === l);
  return found?.key ?? null;
}

export interface PlaceLite {
  id: string;
  name: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: PriceLevel;
  location: { lat: number; lng: number };
  googleMapsUri?: string;
  distanceMeters?: number;
  score?: number;
  openNow?: boolean;
}

export interface PlaceReview {
  text: string;
  rating?: number;
  relativeTime?: string;
  authorName?: string;
}

export interface PlaceDetails extends PlaceLite {
  formattedAddress?: string;
  editorialSummary?: string;
  reviews: PlaceReview[];
  photos: { reference: string; widthPx: number; heightPx: number }[];
  openingHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
}

export interface NearbyRequest {
  lat: number;
  lng: number;
  radius: number;
  category: Category;
  subcategory?: Subcategory;
  openNowOnly?: boolean;
}

export interface NearbyResponse {
  places: PlaceLite[];
  cachedAt?: number;
}
