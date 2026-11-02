import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Search, Check, AlertCircle } from 'lucide-react';
import {
  loadGoogleMaps,
  isGoogleMapsConfigured,
  GoogleMapsStatus,
} from '../../utils/googleMapsLoader';
import {
  validateCoordinates,
  getCurrentLocation,
  KNOWN_LOCALITIES,
  resolveLocationQuery,
} from '../../utils/geolocation';

interface OwnerLocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: { latitude: number; longitude: number } | null) => void;
  defaultCity?: string;
  defaultArea?: string;
  disabled?: boolean;
}

export const OwnerLocationPicker: React.FC<OwnerLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  defaultCity = 'Kolkata',
  defaultArea = 'Salt Lake',
  disabled = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);

  const [status, setStatus] = useState<GoogleMapsStatus>(
    isGoogleMapsConfigured() ? 'loading' : 'unconfigured'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local draft coordinate states
  const [manualLat, setManualLat] = useState<string>(
    typeof latitude === 'number' ? latitude.toString() : ''
  );
  const [manualLng, setManualLng] = useState<string>(
    typeof longitude === 'number' ? longitude.toString() : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync draft strings when external coordinates change
  useEffect(() => {
    if (typeof latitude === 'number' && !isNaN(latitude)) {
      setManualLat(latitude.toString());
    } else {
      setManualLat('');
    }
    if (typeof longitude === 'number' && !isNaN(longitude)) {
      setManualLng(longitude.toString());
    } else {
      setManualLng('');
    }
  }, [latitude, longitude]);

  // Default coordinate center (falls back to Salt Lake, Kolkata if null)
  const effectiveLat = typeof latitude === 'number' && validateCoordinates(latitude, longitude ?? 0)
    ? latitude
    : 22.5804;
  const effectiveLng = typeof longitude === 'number' && validateCoordinates(latitude ?? 0, longitude)
    ? longitude
    : 88.4272;

  // Reposition or create marker on map
  const updateMapMarker = useCallback((lat: number, lng: number, zoomLevel?: number) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const maps = window.google.maps;
    const pos = new maps.LatLng(lat, lng);

    mapInstanceRef.current.panTo(pos);
    if (zoomLevel) {
      mapInstanceRef.current.setZoom(zoomLevel);
    }

    if (!markerInstanceRef.current) {
      const marker = new maps.Marker({
        position: pos,
        map: mapInstanceRef.current,
        draggable: !disabled,
        title: 'Restaurant Location',
        animation: maps.Animation.DROP,
      });

      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        if (newPos) {
          const newLat = Math.round(newPos.lat() * 1000000) / 1000000;
          const newLng = Math.round(newPos.lng() * 1000000) / 1000000;
          setManualLat(newLat.toString());
          setManualLng(newLng.toString());
          setValidationError(null);
          onChange({ latitude: newLat, longitude: newLng });
        }
      });

      markerInstanceRef.current = marker;
    } else {
      markerInstanceRef.current.setPosition(pos);
      markerInstanceRef.current.setDraggable(!disabled);
    }
  }, [disabled, onChange]);

  // Initialize Google Maps instance
  useEffect(() => {
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

        const centerPos = { lat: effectiveLat, lng: effectiveLng };

        if (!mapInstanceRef.current) {
          const map = new maps.Map(mapContainerRef.current, {
            center: centerPos,
            zoom: typeof latitude === 'number' ? 16 : 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'cooperative',
          });

          // Click on map to reposition marker
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (disabled || !e.latLng) return;
            const newLat = Math.round(e.latLng.lat() * 1000000) / 1000000;
            const newLng = Math.round(e.latLng.lng() * 1000000) / 1000000;
            setManualLat(newLat.toString());
            setManualLng(newLng.toString());
            setValidationError(null);
            onChange({ latitude: newLat, longitude: newLng });
            updateMapMarker(newLat, newLng);
          });

          mapInstanceRef.current = map;
        }

        // Place marker if coordinate is already configured
        if (typeof latitude === 'number' && typeof longitude === 'number') {
          updateMapMarker(latitude, longitude);
        }

        setStatus('loaded');
      })
      .catch((err) => {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Failed to initialize Google Maps.');
      });

    return () => {
      isMounted = false;
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
    };
  }, [effectiveLat, effectiveLng, disabled, latitude, longitude, onChange, updateMapMarker]);

  // Apply manual input coordinates
  const handleApplyManualCoords = () => {
    setValidationError(null);
    const parsedLat = parseFloat(manualLat.trim());
    const parsedLng = parseFloat(manualLng.trim());

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setValidationError('Please enter valid numerical numbers for latitude and longitude.');
      return;
    }

    if (!validateCoordinates(parsedLat, parsedLng)) {
      setValidationError('Latitude must be between -90 and 90; longitude must be between -180 and 180.');
      return;
    }

    const roundedLat = Math.round(parsedLat * 1000000) / 1000000;
    const roundedLng = Math.round(parsedLng * 1000000) / 1000000;

    onChange({ latitude: roundedLat, longitude: roundedLng });
    updateMapMarker(roundedLat, roundedLng, 16);
  };

  // Browser Geolocation Quick Capture
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setValidationError(null);
    try {
      const pos = await getCurrentLocation();
      const roundedLat = Math.round(pos.latitude * 1000000) / 1000000;
      const roundedLng = Math.round(pos.longitude * 1000000) / 1000000;

      setManualLat(roundedLat.toString());
      setManualLng(roundedLng.toString());
      onChange({ latitude: roundedLat, longitude: roundedLng });
      updateMapMarker(roundedLat, roundedLng, 17);
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : 'Could not detect current location.');
    } finally {
      setIsLocating(false);
    }
  };

  // Preset Locality Snapping
  const handleSelectPreset = (localityLat: number, localityLng: number) => {
    setValidationError(null);
    setManualLat(localityLat.toString());
    setManualLng(localityLng.toString());
    onChange({ latitude: localityLat, longitude: localityLng });
    updateMapMarker(localityLat, localityLng, 15);
  };

  // Search locality or address lookup
  const handleSearchLocality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setValidationError(null);

    // 1. Check known project localities first
    const resolved = resolveLocationQuery(searchQuery);
    if (resolved) {
      handleSelectPreset(resolved.latitude, resolved.longitude);
      setSearchQuery('');
      return;
    }

    // 2. If Google Maps Geocoder is available, query Google Geocoding
    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: `${searchQuery}, ${defaultCity}` }, (results, gStatus) => {
        if (gStatus === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const lat = Math.round(loc.lat() * 1000000) / 1000000;
          const lng = Math.round(loc.lng() * 1000000) / 1000000;
          setManualLat(lat.toString());
          setManualLng(lng.toString());
          onChange({ latitude: lat, longitude: lng });
          updateMapMarker(lat, lng, 16);
          setSearchQuery('');
        } else {
          setValidationError(`No location found for "${searchQuery}". You can enter coordinates directly or click on the map.`);
        }
      });
      return;
    }

    setValidationError(`Locality "${searchQuery}" not recognized. Please choose from presets or enter coordinates directly.`);
  };

  const hasSelectedCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    validateCoordinates(latitude, longitude);

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <form onSubmit={handleSearchLocality} className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search neighborhood (e.g. ${defaultArea}, Park Street)...`}
            disabled={disabled}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] disabled:opacity-50"
          />
          <Search className="w-4 h-4 text-[#B6A69A] absolute left-3 top-3" />
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isLocating}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#241A15] border border-[#382820] text-[#F5EDE5] hover:text-[#E9A052] hover:border-[#E9A052]/40 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Navigation className="w-3.5 h-3.5 text-[#E9A052]" />
          {isLocating ? 'Locating...' : 'Use My Current Location'}
        </button>
      </div>

      {/* Quick Locality Snapping Chips */}
      <div>
        <span className="text-[11px] text-[#B6A69A] block mb-1.5 font-mono uppercase tracking-wider">
          Quick snap to authentic Kolkata localities:
        </span>
        <div className="flex flex-wrap gap-2">
          {KNOWN_LOCALITIES.slice(0, 4).map((loc) => {
            const isMatch =
              hasSelectedCoords &&
              Math.abs(latitude - loc.latitude) < 0.001 &&
              Math.abs(longitude - loc.longitude) < 0.001;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectPreset(loc.latitude, loc.longitude)}
                disabled={disabled}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isMatch
                    ? 'bg-[#241A15] text-[#E9A052] border-[#E9A052] font-semibold'
                    : 'bg-[#1C1512] text-[#B6A69A] border-[#382820] hover:text-[#F5EDE5] hover:bg-[#241A15]'
                }`}
              >
                {loc.area}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Display Container */}
      <div className="relative w-full rounded-2xl border border-[#382820] overflow-hidden bg-[#241A15]">
        {status === 'loaded' && (
          <div className="h-64 sm:h-80 w-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#1C1512]/95 backdrop-blur-sm border border-[#382820] rounded-xl px-3.5 py-2 text-[11px] text-[#B6A69A] flex items-center justify-between shadow-lg pointer-events-none">
              <span>Click map to place pin, or drag marker to adjust.</span>
              {hasSelectedCoords && (
                <span className="font-mono font-medium text-[#E9A052]">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              )}
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-7 h-7 border-2 border-[#E9A052] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-[#B6A69A] font-medium">Loading Google Maps...</p>
          </div>
        )}

        {status === 'unconfigured' && (
          <div className="p-8 bg-[#1C1512] text-center">
            <div className="w-10 h-10 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-serif font-medium text-[#F5EDE5]">
              Interactive Map Unconfigured
            </h4>
            <p className="text-xs text-[#B6A69A] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Google Maps API key is not yet set in <code className="bg-[#241A15] border border-[#382820] px-1.5 py-0.5 rounded text-[11px] text-[#E9A052]">VITE_GOOGLE_MAPS_API_KEY</code>. You can set the restaurant coordinates accurately using the inputs below, or select a locality preset.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-8 bg-[#1C1512] text-center">
            <AlertCircle className="w-7 h-7 text-[#E9A052] mx-auto mb-2" />
            <h4 className="text-sm font-serif font-medium text-[#F5EDE5]">
              Map Temporarily Unavailable
            </h4>
            <p className="text-xs text-[#B6A69A] mt-1 max-w-sm mx-auto leading-relaxed">
              {errorMessage || 'Unable to connect to Google Maps. You can still set restaurant coordinates directly below.'}
            </p>
          </div>
        )}
      </div>

      {/* Validation or Error Message */}
      {validationError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Manual Latitude & Longitude Inputs (Always Accessible) */}
      <div className="bg-[#1C1512] border border-[#382820] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider">
            Geographic Coordinates
          </label>
          {hasSelectedCoords ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
              <Check className="w-3 h-3" /> Coordinates Active
            </span>
          ) : (
            <span className="text-xs text-[#B6A69A]/60">
              Coordinates not set
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] text-[#B6A69A] mb-1 font-mono">
              Latitude (-90 to 90)
            </label>
            <input
              type="text"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="e.g. 22.580400"
              disabled={disabled}
              className="w-full px-3 py-2 text-xs font-mono border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#B6A69A] mb-1 font-mono">
              Longitude (-180 to 180)
            </label>
            <input
              type="text"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="e.g. 88.427200"
              disabled={disabled}
              className="w-full px-3 py-2 text-xs font-mono border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleApplyManualCoords}
            disabled={disabled || !manualLat.trim() || !manualLng.trim()}
            className="px-4 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Apply Coordinates
          </button>

          {hasSelectedCoords && (
            <button
              type="button"
              onClick={() => {
                setManualLat('');
                setManualLng('');
                onChange(null);
                if (markerInstanceRef.current) {
                  markerInstanceRef.current.setMap(null);
                  markerInstanceRef.current = null;
                }
              }}
              disabled={disabled}
              className="text-xs text-rose-400 hover:underline cursor-pointer"
            >
              Clear coordinates
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
