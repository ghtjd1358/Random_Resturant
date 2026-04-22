/**
 * Best-effort Google Maps URL for a saved record.
 *
 * Priority:
 *  1. Stored googleMapsUri (exact place page)
 *  2. Place ID deep link (always resolves in Google Maps)
 *  3. Name search fallback (for very old records missing both)
 */
export function buildMapUrl(input: {
  placeId: string;
  name: string;
  googleMapsUri?: string;
  lat?: number;
  lng?: number;
}): string {
  if (input.googleMapsUri) return input.googleMapsUri;

  if (input.placeId) {
    // Google Maps resolves this directly to the place.
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(input.placeId)}`;
  }

  const query = encodeURIComponent(input.name);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
