interface Region {
  name: string;
  countryCode: string;
  // rough bounding box: [latMin, latMax, lngMin, lngMax]
  bounds: [number, number, number, number];
}

// First match wins. Cities placed before countries so specific cities beat
// country-level fallbacks.
const REGIONS: Region[] = [
  // — Japan —
  { name: "도쿄", countryCode: "JP", bounds: [35.5, 35.9, 139.4, 139.95] },
  { name: "요코하마", countryCode: "JP", bounds: [35.3, 35.55, 139.55, 139.75] },
  { name: "가마쿠라", countryCode: "JP", bounds: [35.28, 35.36, 139.5, 139.62] },
  { name: "하코네", countryCode: "JP", bounds: [35.18, 35.28, 139.0, 139.15] },
  { name: "닛코", countryCode: "JP", bounds: [36.7, 36.85, 139.55, 139.75] },
  { name: "오사카", countryCode: "JP", bounds: [34.55, 34.8, 135.4, 135.65] },
  { name: "교토", countryCode: "JP", bounds: [34.9, 35.1, 135.6, 135.9] },
  { name: "나라", countryCode: "JP", bounds: [34.65, 34.72, 135.78, 135.88] },
  { name: "고베", countryCode: "JP", bounds: [34.6, 34.75, 135.1, 135.3] },
  { name: "히메지", countryCode: "JP", bounds: [34.8, 34.88, 134.65, 134.75] },
  { name: "나고야", countryCode: "JP", bounds: [35.1, 35.25, 136.85, 137.05] },
  { name: "후쿠오카", countryCode: "JP", bounds: [33.5, 33.65, 130.35, 130.5] },
  { name: "벳푸", countryCode: "JP", bounds: [33.27, 33.32, 131.48, 131.55] },
  { name: "유후인", countryCode: "JP", bounds: [33.26, 33.28, 131.33, 131.38] },
  { name: "구마모토", countryCode: "JP", bounds: [32.75, 32.85, 130.68, 130.78] },
  { name: "가고시마", countryCode: "JP", bounds: [31.55, 31.65, 130.52, 130.6] },
  { name: "오키나와(나하)", countryCode: "JP", bounds: [26.18, 26.25, 127.65, 127.75] },
  { name: "삿포로", countryCode: "JP", bounds: [43.02, 43.12, 141.3, 141.42] },
  { name: "오타루", countryCode: "JP", bounds: [43.18, 43.22, 140.99, 141.05] },
  { name: "하코다테", countryCode: "JP", bounds: [41.72, 41.8, 140.7, 140.8] },
  { name: "센다이", countryCode: "JP", bounds: [38.24, 38.32, 140.85, 140.95] },
  { name: "히로시마", countryCode: "JP", bounds: [34.35, 34.45, 132.4, 132.52] },
  { name: "미야지마", countryCode: "JP", bounds: [34.28, 34.32, 132.3, 132.35] },
  { name: "다카야마", countryCode: "JP", bounds: [36.12, 36.18, 137.23, 137.28] },
  { name: "가나자와", countryCode: "JP", bounds: [36.54, 36.6, 136.6, 136.68] },
  { name: "시라카와고", countryCode: "JP", bounds: [36.24, 36.28, 136.89, 136.93] },
  { name: "후지산 근처", countryCode: "JP", bounds: [35.3, 35.5, 138.6, 138.8] },

  // — Korea —
  { name: "서울", countryCode: "KR", bounds: [37.42, 37.7, 126.8, 127.18] },
  { name: "부산", countryCode: "KR", bounds: [35.05, 35.25, 128.9, 129.2] },
  { name: "제주", countryCode: "KR", bounds: [33.2, 33.6, 126.2, 126.85] },
  { name: "인천", countryCode: "KR", bounds: [37.35, 37.55, 126.45, 126.75] },

  // — Taiwan —
  { name: "타이베이", countryCode: "TW", bounds: [25.02, 25.14, 121.48, 121.6] },
  { name: "지우펀", countryCode: "TW", bounds: [25.1, 25.12, 121.84, 121.86] },
  { name: "가오슝", countryCode: "TW", bounds: [22.58, 22.7, 120.26, 120.35] },
  { name: "타이중", countryCode: "TW", bounds: [24.13, 24.18, 120.64, 120.7] },

  // — Hong Kong & Macau —
  { name: "홍콩", countryCode: "HK", bounds: [22.15, 22.55, 113.83, 114.4] },
  { name: "마카오", countryCode: "MO", bounds: [22.1, 22.22, 113.52, 113.6] },

  // — Southeast Asia —
  { name: "방콕", countryCode: "TH", bounds: [13.65, 13.9, 100.42, 100.62] },
  { name: "치앙마이", countryCode: "TH", bounds: [18.75, 18.82, 98.96, 99.02] },
  { name: "푸켓", countryCode: "TH", bounds: [7.85, 7.95, 98.3, 98.42] },
  { name: "하노이", countryCode: "VN", bounds: [20.98, 21.08, 105.78, 105.88] },
  { name: "호치민", countryCode: "VN", bounds: [10.73, 10.83, 106.65, 106.75] },
  { name: "다낭", countryCode: "VN", bounds: [16.03, 16.1, 108.18, 108.25] },
  { name: "싱가포르", countryCode: "SG", bounds: [1.23, 1.47, 103.6, 104.0] },
  { name: "쿠알라룸푸르", countryCode: "MY", bounds: [3.09, 3.2, 101.64, 101.74] },
  { name: "세부", countryCode: "PH", bounds: [10.25, 10.38, 123.85, 123.95] },
  { name: "발리(우붓)", countryCode: "ID", bounds: [-8.53, -8.49, 115.24, 115.28] },
  { name: "발리(쿠타)", countryCode: "ID", bounds: [-8.74, -8.71, 115.15, 115.2] },
  { name: "자카르타", countryCode: "ID", bounds: [-6.25, -6.14, 106.78, 106.88] },

  // — China —
  { name: "상하이", countryCode: "CN", bounds: [31.17, 31.28, 121.42, 121.52] },
  { name: "베이징", countryCode: "CN", bounds: [39.88, 39.96, 116.35, 116.45] },

  // — Europe —
  { name: "파리", countryCode: "FR", bounds: [48.82, 48.9, 2.28, 2.41] },
  { name: "런던", countryCode: "GB", bounds: [51.47, 51.55, -0.2, 0.0] },
  { name: "바르셀로나", countryCode: "ES", bounds: [41.36, 41.42, 2.13, 2.2] },
  { name: "마드리드", countryCode: "ES", bounds: [40.39, 40.46, -3.74, -3.65] },
  { name: "로마", countryCode: "IT", bounds: [41.86, 41.94, 12.44, 12.55] },
  { name: "밀라노", countryCode: "IT", bounds: [45.43, 45.5, 9.14, 9.22] },
  { name: "피렌체", countryCode: "IT", bounds: [43.75, 43.79, 11.22, 11.28] },
  { name: "베네치아", countryCode: "IT", bounds: [45.42, 45.45, 12.32, 12.36] },
  { name: "베를린", countryCode: "DE", bounds: [52.48, 52.56, 13.35, 13.47] },
  { name: "뮌헨", countryCode: "DE", bounds: [48.11, 48.17, 11.53, 11.6] },
  { name: "프라하", countryCode: "CZ", bounds: [50.05, 50.11, 14.4, 14.47] },
  { name: "빈", countryCode: "AT", bounds: [48.18, 48.24, 16.34, 16.42] },
  { name: "암스테르담", countryCode: "NL", bounds: [52.34, 52.4, 4.85, 4.93] },
  { name: "스위스(취리히)", countryCode: "CH", bounds: [47.35, 47.4, 8.51, 8.57] },
  { name: "이스탄불", countryCode: "TR", bounds: [40.98, 41.08, 28.92, 29.05] },

  // — North America —
  { name: "뉴욕", countryCode: "US", bounds: [40.68, 40.82, -74.02, -73.9] },
  { name: "LA", countryCode: "US", bounds: [33.96, 34.13, -118.48, -118.2] },
  { name: "샌프란시스코", countryCode: "US", bounds: [37.72, 37.83, -122.52, -122.38] },
  { name: "시애틀", countryCode: "US", bounds: [47.55, 47.7, -122.4, -122.27] },
  { name: "라스베이거스", countryCode: "US", bounds: [36.08, 36.2, -115.28, -115.13] },
  { name: "시카고", countryCode: "US", bounds: [41.82, 41.95, -87.72, -87.58] },
  { name: "호놀룰루", countryCode: "US", bounds: [21.27, 21.33, -157.87, -157.8] },
  { name: "밴쿠버", countryCode: "CA", bounds: [49.2, 49.32, -123.22, -123.02] },
  { name: "토론토", countryCode: "CA", bounds: [43.6, 43.75, -79.54, -79.28] },

  // — Oceania —
  { name: "시드니", countryCode: "AU", bounds: [-33.92, -33.82, 151.17, 151.28] },
  { name: "멜버른", countryCode: "AU", bounds: [-37.85, -37.78, 144.92, 145.02] },

  // — Middle East —
  { name: "두바이", countryCode: "AE", bounds: [25.17, 25.28, 55.2, 55.4] },
];

// Country-level fallback bounding boxes (used when no city matched).
const COUNTRIES: { name: string; code: string; bounds: [number, number, number, number] }[] = [
  { name: "일본", code: "JP", bounds: [24, 46, 122, 146] },
  { name: "한국", code: "KR", bounds: [33, 39, 124, 132] },
  { name: "대만", code: "TW", bounds: [21, 26, 120, 122.5] },
  { name: "중국", code: "CN", bounds: [18, 54, 73, 135] },
  { name: "태국", code: "TH", bounds: [5.5, 20.5, 97, 106] },
  { name: "베트남", code: "VN", bounds: [8, 23.5, 102, 110] },
  { name: "필리핀", code: "PH", bounds: [5, 21, 117, 127] },
  { name: "인도네시아", code: "ID", bounds: [-11, 6, 95, 141] },
  { name: "말레이시아", code: "MY", bounds: [1, 7, 100, 119] },
  { name: "싱가포르", code: "SG", bounds: [1.1, 1.5, 103.5, 104.1] },
  { name: "인도", code: "IN", bounds: [8, 35, 68, 97] },
  { name: "홍콩", code: "HK", bounds: [22.1, 22.6, 113.8, 114.5] },
  { name: "미국", code: "US", bounds: [24, 49, -125, -66] },
  { name: "캐나다", code: "CA", bounds: [42, 70, -141, -52] },
  { name: "멕시코", code: "MX", bounds: [14, 33, -117, -86] },
  { name: "영국", code: "GB", bounds: [49, 61, -8, 2] },
  { name: "프랑스", code: "FR", bounds: [41, 51, -5, 10] },
  { name: "독일", code: "DE", bounds: [47, 55, 5, 15.5] },
  { name: "이탈리아", code: "IT", bounds: [36, 47, 6.5, 18.5] },
  { name: "스페인", code: "ES", bounds: [36, 44, -9.5, 4.5] },
  { name: "포르투갈", code: "PT", bounds: [36, 42, -9.6, -6] },
  { name: "네덜란드", code: "NL", bounds: [50, 54, 3, 7.5] },
  { name: "스위스", code: "CH", bounds: [45.8, 47.9, 5.9, 10.5] },
  { name: "오스트리아", code: "AT", bounds: [46, 49, 9.5, 17.2] },
  { name: "체코", code: "CZ", bounds: [48.5, 51.1, 12, 18.9] },
  { name: "터키", code: "TR", bounds: [36, 42, 26, 45] },
  { name: "UAE", code: "AE", bounds: [22, 26.5, 51, 57] },
  { name: "호주", code: "AU", bounds: [-44, -10, 112, 154] },
  { name: "뉴질랜드", code: "NZ", bounds: [-47, -34, 166, 179] },
];

export interface RegionInfo {
  name: string;
  countryCode: string;
}

function inside(
  lat: number,
  lng: number,
  bounds: [number, number, number, number],
): boolean {
  return lat >= bounds[0] && lat <= bounds[1] && lng >= bounds[2] && lng <= bounds[3];
}

export function guessRegionInfo(lat: number, lng: number): RegionInfo | null {
  for (const r of REGIONS) {
    if (inside(lat, lng, r.bounds)) return { name: r.name, countryCode: r.countryCode };
  }
  for (const c of COUNTRIES) {
    if (inside(lat, lng, c.bounds)) {
      return { name: `${c.name} 어딘가`, countryCode: c.code };
    }
  }
  return null;
}

/** Back-compat: just the display name. */
export function guessRegion(lat: number, lng: number): string | null {
  return guessRegionInfo(lat, lng)?.name ?? null;
}

/** Just the ISO country code for Places API regionCode, or null if unknown. */
export function guessCountryCode(lat: number, lng: number): string | null {
  return guessRegionInfo(lat, lng)?.countryCode ?? null;
}
