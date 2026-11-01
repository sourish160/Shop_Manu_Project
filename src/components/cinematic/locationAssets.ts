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
  collegeStreet: '/images/locations/college-street.jpg',
  newMarket: '/images/locations/new-market.jpg',
  shobhabazar: '/images/locations/shobhabazar.jpg',
  ballygunge: '/images/locations/ballygunge.jpg',
  parkCircus: '/images/locations/park-circus.jpg',
  saltLake: '/images/locations/salt-lake.jpg',
  newTown: '/images/locations/new-town.jpg',
  streetStalls: '/images/locations/street-stalls.jpg',
  default: '/images/locations/park-street.jpg',
};

/**
 * Resolves an authentic atmospheric photography asset for a Kolkata locality.
 */
export function resolveLocalityImage(areaName?: string | null): string {
  if (!areaName) return LOCATION_IMAGE_MAP.default;

  const text = areaName.toLowerCase();
  if (text.includes('college') || text.includes('university') || text.includes('bowbazar') || text.includes('boi para')) {
    return LOCATION_IMAGE_MAP.collegeStreet;
  }
  if (text.includes('new market') || text.includes('esplanade') || text.includes('dharmatala') || text.includes('hogg')) {
    return LOCATION_IMAGE_MAP.newMarket;
  }
  if (text.includes('shobhabazar') || text.includes('shyambazar') || text.includes('kumartuli') || text.includes('north')) {
    return LOCATION_IMAGE_MAP.shobhabazar;
  }
  if (text.includes('ballygunge') || text.includes('gariahat') || text.includes('hazra') || text.includes('south')) {
    return LOCATION_IMAGE_MAP.ballygunge;
  }
  if (text.includes('park circus') || text.includes('beniapukur') || text.includes('beckbagan') || text.includes('7 point')) {
    return LOCATION_IMAGE_MAP.parkCircus;
  }
  if (text.includes('park') || text.includes('camac') || text.includes('russell')) {
    return LOCATION_IMAGE_MAP.parkStreet;
  }
  if (text.includes('salt') || text.includes('sector') || text.includes('bidhannagar')) {
    return LOCATION_IMAGE_MAP.saltLake;
  }
  if (text.includes('new town') || text.includes('rajarhat') || text.includes('action area')) {
    return LOCATION_IMAGE_MAP.newTown;
  }

  return LOCATION_IMAGE_MAP.streetStalls;
}

