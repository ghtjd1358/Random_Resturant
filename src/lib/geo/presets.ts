export interface LocationPreset {
  id: string;
  city: string;
  label: string;
  emoji?: string;
  lat: number;
  lng: number;
  /** Meters. Applied to the filter store when this preset is picked. */
  defaultRadius: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  // 도쿄
  { id: "tokyo-shinjuku", city: "도쿄", label: "신주쿠역", emoji: "🗼", lat: 35.6896, lng: 139.7006, defaultRadius: 600 },
  { id: "tokyo-shibuya", city: "도쿄", label: "시부야 스크램블", emoji: "🎌", lat: 35.6595, lng: 139.7004, defaultRadius: 600 },
  { id: "tokyo-ginza", city: "도쿄", label: "긴자", emoji: "✨", lat: 35.6721, lng: 139.7636, defaultRadius: 500 },
  { id: "tokyo-asakusa", city: "도쿄", label: "아사쿠사 센소지", emoji: "⛩️", lat: 35.7148, lng: 139.7967, defaultRadius: 500 },
  { id: "tokyo-akihabara", city: "도쿄", label: "아키하바라", emoji: "🎮", lat: 35.6987, lng: 139.7731, defaultRadius: 500 },

  // 오사카
  { id: "osaka-namba", city: "오사카", label: "난바·도톤보리", emoji: "🐙", lat: 34.6687, lng: 135.5013, defaultRadius: 600 },
  { id: "osaka-umeda", city: "오사카", label: "우메다", emoji: "🚉", lat: 34.7024, lng: 135.4959, defaultRadius: 600 },
  { id: "osaka-shinsekai", city: "오사카", label: "신세카이", emoji: "🗼", lat: 34.6524, lng: 135.5065, defaultRadius: 500 },

  // 교토
  { id: "kyoto-gion", city: "교토", label: "기온", emoji: "🏮", lat: 35.0037, lng: 135.7782, defaultRadius: 600 },
  { id: "kyoto-kawaramachi", city: "교토", label: "카와라마치", emoji: "🌸", lat: 35.0036, lng: 135.7690, defaultRadius: 500 },
];

export function findPreset(id: string): LocationPreset | undefined {
  return LOCATION_PRESETS.find((p) => p.id === id);
}

/** Group presets by city, preserving the order they appear in LOCATION_PRESETS. */
export function presetsByCity(): { city: string; items: LocationPreset[] }[] {
  const order: string[] = [];
  const map = new Map<string, LocationPreset[]>();
  for (const p of LOCATION_PRESETS) {
    if (!map.has(p.city)) {
      map.set(p.city, []);
      order.push(p.city);
    }
    map.get(p.city)!.push(p);
  }
  return order.map((city) => ({ city, items: map.get(city)! }));
}
