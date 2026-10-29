/**
 * =========================================================================
 * CHAPTER V: FIND FOOD NEAR YOU — ASSET MAPPING & LOCATION PHOTOGRAPHY
 * =========================================================================
 *
 * HOW TO REPLACE TEMPORARY PHOTOGRAPHS:
 * 1. Place your neighborhood, street-food stall, or storefront photographs in:
 *    `public/images/locations/` (e.g., `public/images/locations/park-street.jpg`, `salt-lake.jpg`, etc.)
 * 2. Update the `LOCATION_IMAGE_MAP` dictionary below with your local file paths
 *    or hosted CDN URLs.
 */

export const LOCATION_IMAGE_MAP: Record<string, string> = {
  parkStreet: '/images/locations/park-street.jpg',
  saltLake: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
  newTown: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85',
  central: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85',
  streetStalls: '/images/locations/street-food.jpg',
  default: '/images/locations/park-street.jpg',
};

/**
 * Resolves an atmospheric photography asset for a Kolkata locality.
 */
export function resolveLocalityImage(areaName?: string | null): string {
  if (!areaName) return LOCATION_IMAGE_MAP.default;

  const text = areaName.toLowerCase();
  if (text.includes('park') || text.includes('camac') || text.includes('russell')) {
    return LOCATION_IMAGE_MAP.parkStreet;
  }
  if (text.includes('salt') || text.includes('sector') || text.includes('bidhannagar')) {
    return LOCATION_IMAGE_MAP.saltLake;
  }
  if (text.includes('new town') || text.includes('rajarhat') || text.includes('action area')) {
    return LOCATION_IMAGE_MAP.newTown;
  }
  if (text.includes('ballygunge') || text.includes('gariahat') || text.includes('south')) {
    return LOCATION_IMAGE_MAP.central;
  }
  if (text.includes('esplanade') || text.includes('howrah') || text.includes('shyambazar')) {
    return LOCATION_IMAGE_MAP.streetStalls;
  }

  return LOCATION_IMAGE_MAP.default;
}

