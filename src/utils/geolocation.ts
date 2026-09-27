export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationState {
  type: 'none' | 'current' | 'manual';
  name: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
}

export const DEFAULT_RADIUS_KM = 5;
export const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export interface KnownLocality {
  id: string;
  name: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const KNOWN_LOCALITIES: KnownLocality[] = [
  {
    id: 'salt-lake',
    name: 'Salt Lake, Kolkata',
    area: 'Salt Lake',
    city: 'Kolkata',
    latitude: 22.5804,
    longitude: 88.4272,
  },
  {
    id: 'new-town',
    name: 'New Town, Kolkata',
    area: 'New Town',
    city: 'Kolkata',
    latitude: 22.5935,
    longitude: 88.4716,
  },
  {
    id: 'park-street',
    name: 'Park Street, Kolkata',
    area: 'Park Street',
    city: 'Kolkata',
    latitude: 22.5516,
    longitude: 88.3524,
  },
  {
    id: 'esplanade',
    name: 'Esplanade / Central Kolkata',
    area: 'Esplanade',
    city: 'Kolkata',
    latitude: 22.5697,
    longitude: 88.3516,
  },
  {
    id: 'ballygunge',
    name: 'Ballygunge, Kolkata',
    area: 'Ballygunge',
    city: 'Kolkata',
    latitude: 22.528,
    longitude: 88.3655,
  },
  {
    id: 'howrah',
    name: 'Howrah',
    area: 'Howrah',
    city: 'Kolkata',
    latitude: 22.5958,
    longitude: 88.2636,
  },
];

/**
 * Validates that latitude and longitude are valid numeric geographic coordinates.
 */
export function validateCoordinates(latitude: unknown, longitude: unknown): boolean {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  if (latitude < -90.0 || latitude > 90.0) {
    return false;
  }
  if (longitude < -180.0 || longitude > 180.0) {
    return false;
  }
  return true;
}

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates.
 * Used for local verification and client assertions.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Formats distance into a clean, human-readable string.
 * Example: 0.7 km, 1.4 km, 3.2 km, or empty string if distance is null/undefined.
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm) || distanceKm < 0) {
    return '';
  }
  if (distanceKm < 0.05) {
    return '< 50 m';
  }
  if (distanceKm < 1.0) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Requests the customer's current position from the browser Geolocation API.
 * Returns normalized coordinates or a friendly, actionable error message.
 */
export async function getCurrentLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      reject(new Error('Your browser does not support geolocation. Search a location instead.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (!validateCoordinates(latitude, longitude)) {
          reject(new Error('Received invalid location coordinates from browser.'));
          return;
        }
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access was not allowed. Search a location instead.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable. Search a location instead.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again or search a location.'));
            break;
          default:
            reject(new Error('Unable to retrieve current location. Search a location instead.'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Resolves a manual location query string to geographic reference coordinates.
 */
export function resolveLocationQuery(query: string): KnownLocality | null {
  if (!query || !query.trim()) return null;
  const normQ = query.trim().toLowerCase();

  const exact = KNOWN_LOCALITIES.find(
    (loc) =>
      loc.name.toLowerCase() === normQ ||
      loc.area.toLowerCase() === normQ ||
      loc.id.toLowerCase() === normQ
  );
  if (exact) return exact;

  const partial = KNOWN_LOCALITIES.find(
    (loc) =>
      loc.name.toLowerCase().includes(normQ) ||
      loc.area.toLowerCase().includes(normQ) ||
      normQ.includes(loc.area.toLowerCase())
  );
  return partial || null;
}

const SESSION_STORAGE_KEY = 'shop_manu_customer_location';

/**
 * Saves location state in session storage for the current browsing session.
 * Does not store permanently on server or database for privacy protection.
 */
export function saveSessionLocation(state: LocationState): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Loads location state from current session storage.
 */
export function loadSessionLocation(): LocationState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === 'string' && typeof parsed.radiusKm === 'number') {
      return parsed as LocationState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears location state from session storage.
 */
export function clearSessionLocation(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
