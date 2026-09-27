import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle, ExternalLink } from 'lucide-react';
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  getGoogleMapsDirectionsUrl,
  GoogleMapsStatus,
} from '../../utils/googleMapsLoader';
import { validateCoordinates } from '../../utils/geolocation';

interface RestaurantMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  restaurantName: string;
  address: string;
  area?: string;
  city?: string;
  className?: string;
  zoom?: number;
}

export const RestaurantMap: React.FC<RestaurantMapProps> = ({
  latitude,
  longitude,
  restaurantName,
  address,
  area,
  city,
  className = '',
  zoom = 15,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [status, setStatus] = useState<GoogleMapsStatus>(
    isGoogleMapsConfigured() ? 'loading' : 'unconfigured'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasValidCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    validateCoordinates(latitude, longitude);

  const directionsUrl = hasValidCoordinates
    ? getGoogleMapsDirectionsUrl(latitude, longitude, restaurantName)
    : null;

  useEffect(() => {
    // If coordinates are invalid or missing, do not attempt to load map
    if (!hasValidCoordinates) {
      return;
    }

    if (!isGoogleMapsConfigured()) {
      setStatus('unconfigured');
      return;
    }

    let isMounted = true;
    setStatus('loading');
    setErrorMessage(null);

    loadGoogleMaps()
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const centerPos = { lat: latitude as number, lng: longitude as number };

        // Reuse existing map instance or create new
        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: centerPos,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
            styles: [
              {
                featureType: 'poi.business',
                stylers: [{ visibility: 'on' }],
              },
            ],
          });
          mapInstanceRef.current = map;
        } else {
          mapInstanceRef.current.setCenter(centerPos);
          mapInstanceRef.current.setZoom(zoom);
        }

        // Clean up previous marker if any
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setMap(null);
        }

        const marker = new maps.Marker({
          position: centerPos,
          map: mapInstanceRef.current,
          title: restaurantName,
          animation: maps.Animation.DROP,
        });
        markerInstanceRef.current = marker;

        // Info Window with clean HTML
        const locationText = [area, city].filter(Boolean).join(', ');
        const infoContent = `
          <div style="padding: 4px 6px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
              ${restaurantName.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              ${address.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              ${locationText ? `<br/><span style="color: #64748b;">${locationText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>` : ''}
            </div>
            ${
              directionsUrl
                ? `<a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 11px; font-weight: 600; color: #0284c7; text-decoration: none; margin-top: 4px;">
                    Get Directions &rarr;
                   </a>`
                : ''
            }
          </div>
        `;

        const infoWindow = new maps.InfoWindow({
          content: infoContent,
        });
        infoWindowRef.current = infoWindow;

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        setStatus('loaded');
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Unable to load Google Maps.');
      });

    return () => {
      isMounted = false;
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [latitude, longitude, restaurantName, address, area, city, zoom, hasValidCoordinates, directionsUrl]);

  // Case 1: Restaurant does not have valid coordinates
  if (!hasValidCoordinates) {
    return (
      <div
        className={`w-full bg-slate-50 border border-slate-200 rounded-md p-6 flex flex-col items-center justify-center text-center ${className}`}
        style={{ minHeight: '220px' }}
      >
        <MapPin className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
        <p className="text-xs font-semibold text-slate-800">
          Location coordinates not specified
        </p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          The restaurant has not recorded exact geographic coordinates. You can locate it using the street address above.
        </p>
      </div>
    );
  }

  // Case 2: API key is not configured in environment
  if (status === 'unconfigured') {
    return (
      <div
        className={`w-full bg-slate-50 border border-slate-200 rounded-md p-5 flex flex-col justify-between ${className}`}
        style={{ minHeight: '220px' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Interactive Map
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Interactive map rendering is temporarily unavailable. The verified geographic coordinates are recorded in the system.
            </p>
            <div className="mt-2 text-[11px] font-mono text-slate-500">
              Coordinates: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            </div>
          </div>
        </div>

        {directionsUrl && (
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">Need navigation?</span>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Get Directions
            </a>
          </div>
        )}
      </div>
    );
  }

  // Case 3: Error loading Google Maps script or auth failure
  if (status === 'error') {
    return (
      <div
        className={`w-full bg-amber-50/60 border border-amber-200 rounded-md p-5 flex flex-col justify-between ${className}`}
        style={{ minHeight: '220px' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-amber-900">
              Map Temporarily Unavailable
            </h4>
            <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
              {errorMessage || 'Unable to connect to Google Maps Platform services.'}
            </p>
            <div className="mt-2 text-[11px] font-mono text-slate-600">
              Coordinates: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            </div>
          </div>
        </div>

        {directionsUrl && (
          <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
            <span className="text-xs text-amber-900">Navigate directly:</span>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Google Maps
            </a>
          </div>
        )}
      </div>
    );
  }

  // Case 4: Map Container (Active or Loading)
  return (
    <div className={`relative w-full rounded-md overflow-hidden border border-slate-200 ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-slate-100 z-10 flex flex-col items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading Google Maps...</p>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-64 sm:h-72"
        aria-label={`Map of ${restaurantName}`}
      />
    </div>
  );
};
