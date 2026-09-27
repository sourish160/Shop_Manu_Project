/**
 * Google Maps Platform API Loader & Navigation Utilities
 * Phase 6: Production Google Maps Integration
 *
 * Implements a robust singleton loader for Google Maps JavaScript API.
 * Never hardcodes API keys; safely reads from VITE_GOOGLE_MAPS_API_KEY.
 * Gracefully handles missing keys, network timeouts, invalid keys (gm_authFailure),
 * and quota exhaustion without crashing the application.
 */

export type GoogleMapsStatus = 'unconfigured' | 'loading' | 'loaded' | 'error';

let loadPromise: Promise<typeof google.maps> | null = null;
let currentStatus: GoogleMapsStatus = 'unconfigured';
let statusListeners: Array<(status: GoogleMapsStatus, errorMsg?: string) => void> = [];

/**
 * Retrieves the Google Maps API key from Vite environment.
 * Never throws; returns empty string if unconfigured.
 */
export function getGoogleMapsApiKey(): string {
  // Safe environment lookup for Vite client
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

/**
 * Checks if a non-empty Google Maps API key is configured.
 */
export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

/**
 * Returns current Google Maps SDK loading status.
 */
export function getGoogleMapsStatus(): GoogleMapsStatus {
  if (!isGoogleMapsConfigured()) {
    return 'unconfigured';
  }
  return currentStatus;
}

/**
 * Subscribes to status changes for components that need reactive updates.
 */
export function subscribeToGoogleMapsStatus(
  listener: (status: GoogleMapsStatus, errorMsg?: string) => void
): () => void {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

function notifyListeners(status: GoogleMapsStatus, errorMsg?: string): void {
  currentStatus = status;
  statusListeners.forEach((l) => l(status, errorMsg));
}

/**
 * Loads the Google Maps JavaScript SDK asynchronously.
 * Idempotent: Subsequent calls return the same cached promise.
 */
export function loadGoogleMaps(): Promise<typeof google.maps> {
  // If already available on window, resolve immediately
  if (typeof window !== 'undefined' && window.google?.maps) {
    currentStatus = 'loaded';
    return Promise.resolve(window.google.maps);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    currentStatus = 'unconfigured';
    return Promise.reject(new Error('Google Maps API key is not configured in VITE_GOOGLE_MAPS_API_KEY.'));
  }

  if (loadPromise) {
    return loadPromise;
  }

  currentStatus = 'loading';
  notifyListeners('loading');

  loadPromise = new Promise<typeof google.maps>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps cannot be loaded in a non-browser environment.'));
      return;
    }

    const callbackName = `__initGoogleMaps_${Date.now()}`;

    // Hook Google Maps global authentication failure callback
    const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
      currentStatus = 'error';
      notifyListeners('error', 'Google Maps authentication failed. Please verify API key permissions and billing.');
      reject(new Error('Google Maps authentication failed (gm_authFailure).'));
    };

    // Global callback when script finishes evaluating
    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (window.google?.maps) {
        currentStatus = 'loaded';
        notifyListeners('loaded');
        resolve(window.google.maps);
      } else {
        currentStatus = 'error';
        notifyListeners('error', 'Google Maps object not found after script execution.');
        reject(new Error('Google Maps object not found after script load.'));
      }
    };

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    // Loading with libraries=places,geometry for geocoding and location calculations
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&callback=${callbackName}&libraries=places,geometry&v=weekly`;

    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      currentStatus = 'error';
      notifyListeners('error', 'Network failure while loading Google Maps SDK.');
      reject(new Error('Failed to load Google Maps script. Check network connection and API key.'));
    };

    // Timeout safety (15 seconds)
    const timeoutId = setTimeout(() => {
      if (currentStatus === 'loading') {
        currentStatus = 'error';
        notifyListeners('error', 'Google Maps load request timed out.');
        reject(new Error('Google Maps script load timed out after 15 seconds.'));
      }
    }, 15000);

    document.head.appendChild(script);

    // Clear timeout upon script resolution
    loadPromise?.finally(() => clearTimeout(timeoutId));
  });

  return loadPromise;
}

/**
 * Builds an official universal Google Maps Directions URL.
 * Supported across web browsers, iOS, and Android.
 *
 * Official spec: https://developers.google.com/maps/documentation/urls/get-started#directions-action
 *
 * @param latitude Target destination latitude
 * @param longitude Target destination longitude
 * @param destinationName Optional destination title for cleaner navigation UI
 */
export function getGoogleMapsDirectionsUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  _destinationName?: string
): string | null {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  const destinationParam = `${latitude},${longitude}`;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationParam)}`;

  return base;
}

/**
 * Builds a direct Google Maps Search / Place URL.
 */
export function getGoogleMapsLocationUrl(
  latitude: number,
  longitude: number,
  title?: string
): string {
  const query = title ? `${title} (${latitude},${longitude})` : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
