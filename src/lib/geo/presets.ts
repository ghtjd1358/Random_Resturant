export interface LocationPreset {
  id: string;
  city: string;
  label: string;
  /** Single Han glyph used as the chip's editorial icon — picked to evoke
   *  the place's name or character, not its first hangul letter. */
  kanji: string;
  /** City group's own kanji glyph (used as section header decoration). */
  cityKanji: string;
  lat: number;
  lng: number;
  /** Meters. Applied to the filter store when this preset is picked. */
  defaultRadius: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  // 서울 (京)
  { id: "seoul-gangnam",    city: "서울", cityKanji: "京", label: "강남역",      kanji: "江", lat: 37.4979, lng: 127.0276, defaultRadius: 500 },
  { id: "seoul-hongdae",    city: "서울", cityKanji: "京", label: "홍대입구",    kanji: "弘", lat: 37.5561, lng: 126.9236, defaultRadius: 600 },
  { id: "seoul-myeongdong", city: "서울", cityKanji: "京", label: "명동",       kanji: "明", lat: 37.5636, lng: 126.9826, defaultRadius: 500 },
  { id: "seoul-seongsu",    city: "서울", cityKanji: "京", label: "성수동",      kanji: "聖", lat: 37.5443, lng: 127.0557, defaultRadius: 600 },
  { id: "seoul-itaewon",    city: "서울", cityKanji: "京", label: "이태원",      kanji: "梨", lat: 37.5344, lng: 126.9947, defaultRadius: 500 },

  // 부산 (釜)
  { id: "busan-haeundae", city: "부산", cityKanji: "釜", label: "해운대", kanji: "海", lat: 35.1587, lng: 129.1604, defaultRadius: 600 },
  { id: "busan-seomyeon", city: "부산", cityKanji: "釜", label: "서면",   kanji: "西", lat: 35.1579, lng: 129.0594, defaultRadius: 600 },

  // 제주 (濟)
  { id: "jeju-city", city: "제주", cityKanji: "濟", label: "제주시 구도심", kanji: "濟", lat: 33.5110, lng: 126.5219, defaultRadius: 700 },

  // 도쿄 (東)
  { id: "tokyo-shinjuku",   city: "도쿄", cityKanji: "東", label: "신주쿠역",       kanji: "新", lat: 35.6896, lng: 139.7006, defaultRadius: 600 },
  { id: "tokyo-shibuya",    city: "도쿄", cityKanji: "東", label: "시부야 스크램블", kanji: "渋", lat: 35.6595, lng: 139.7004, defaultRadius: 600 },
  { id: "tokyo-ginza",      city: "도쿄", cityKanji: "東", label: "긴자",          kanji: "銀", lat: 35.6721, lng: 139.7636, defaultRadius: 500 },
  { id: "tokyo-asakusa",    city: "도쿄", cityKanji: "東", label: "아사쿠사 센소지", kanji: "浅", lat: 35.7148, lng: 139.7967, defaultRadius: 500 },
  { id: "tokyo-akihabara",  city: "도쿄", cityKanji: "東", label: "아키하바라",     kanji: "秋", lat: 35.6987, lng: 139.7731, defaultRadius: 500 },

  // 오사카 (大)
  { id: "osaka-namba",      city: "오사카", cityKanji: "大", label: "난바·도톤보리", kanji: "難", lat: 34.6687, lng: 135.5013, defaultRadius: 600 },
  { id: "osaka-umeda",      city: "오사카", cityKanji: "大", label: "우메다",       kanji: "梅", lat: 34.7024, lng: 135.4959, defaultRadius: 600 },
  { id: "osaka-shinsekai",  city: "오사카", cityKanji: "大", label: "신세카이",     kanji: "世", lat: 34.6524, lng: 135.5065, defaultRadius: 500 },

  // 교토 (京都)
  { id: "kyoto-gion",         city: "교토", cityKanji: "都", label: "기온",       kanji: "祇", lat: 35.0037, lng: 135.7782, defaultRadius: 600 },
  { id: "kyoto-kawaramachi",  city: "교토", cityKanji: "都", label: "카와라마치", kanji: "河", lat: 35.0036, lng: 135.7690, defaultRadius: 500 },
];

export function findPreset(id: string): LocationPreset | undefined {
  return LOCATION_PRESETS.find((p) => p.id === id);
}

/** Group presets by city, preserving the order they appear in LOCATION_PRESETS. */
export function presetsByCity(): {
  city: string;
  cityKanji: string;
  items: LocationPreset[];
}[] {
  const order: string[] = [];
  const map = new Map<string, LocationPreset[]>();
  for (const p of LOCATION_PRESETS) {
    if (!map.has(p.city)) {
      map.set(p.city, []);
      order.push(p.city);
    }
    map.get(p.city)!.push(p);
  }
  return order.map((city) => ({
    city,
    cityKanji: map.get(city)![0].cityKanji,
    items: map.get(city)!,
  }));
}
