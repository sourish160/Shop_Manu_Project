import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Loader2,
  X,
  ChevronDown,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  LocationState,
  getCurrentLocation,
  KNOWN_LOCALITIES,
  KnownLocality,
  saveSessionLocation,
  clearSessionLocation,
} from '../../utils/geolocation';

interface LocationSelectorProps {
  location: LocationState;
  onChange: (newLocation: LocationState) => void;
  className?: string;
  size?: 'default' | 'compact';
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  location,
  onChange,
  className = '',
  size = 'default',
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleNearMeClick = async () => {
    setIsLocating(true);
    setErrorMessage(null);

    try {
      const coords = await getCurrentLocation();
      const updated: LocationState = {
        type: 'current',
        name: 'Near Me',
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: location.radiusKm || 5,
      };
      saveSessionLocation(updated);
      onChange(updated);
      setIsDropdownOpen(false);
    } catch (err: any) {
      console.warn('Geolocation access issue:', err.message);
      setErrorMessage(err.message || 'Location access was not allowed. Search a location instead.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectLocality = (locality: KnownLocality) => {
    const updated: LocationState = {
      type: 'manual',
      name: locality.name,
      latitude: locality.latitude,
      longitude: locality.longitude,
      radiusKm: location.radiusKm || 5,
    };
    saveSessionLocation(updated);
    onChange(updated);
    setErrorMessage(null);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleClearLocation = () => {
    const cleared: LocationState = {
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: location.radiusKm || 5,
    };
    clearSessionLocation();
    onChange(cleared);
    setErrorMessage(null);
  };

  const filteredLocalities = KNOWN_LOCALITIES.filter((loc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.area.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q)
    );
  });

  const isLocationActive = location.type !== 'none' && location.latitude !== null && location.longitude !== null;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Active Location Display Badge */}
      {isLocationActive ? (
        <div className="inline-flex items-center space-x-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{location.name}</span>
          <span className="text-slate-400">• {location.radiusKm} km</span>

          <button
            type="button"
            onClick={handleClearLocation}
            aria-label="Remove location filter"
            className="p-0.5 ml-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Reset to all locations"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Action Buttons: Near Me & Select Locality */
        <div className="inline-flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleNearMeClick}
            disabled={isLocating}
            aria-label="Use current location"
            className={`inline-flex items-center space-x-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-medium rounded-lg transition-colors shadow-sm ${
              size === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            }`}
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-label="Select location from list"
            className={`inline-flex items-center space-x-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-medium rounded-lg transition-colors shadow-sm ${
              size === 'compact' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>Select Locality</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>
      )}

      {/* Permission Denied / Error Toast */}
      {errorMessage && (
        <div
          role="alert"
          className="absolute z-50 left-0 mt-2 w-72 bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-lg shadow-lg flex items-start space-x-2"
        >
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Location Access Notice</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsDropdownOpen(true);
              }}
              className="mt-2 text-xs font-semibold text-amber-950 underline hover:no-underline"
            >
              Choose a locality instead →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error notice"
            className="text-amber-600 hover:text-amber-900 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Localities Selection Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 left-0 mt-1 w-64 sm:w-72 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1 divide-y divide-slate-100">
          <div className="p-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area (e.g. Salt Lake)..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Popular Localities
            </div>
            {filteredLocalities.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectLocality(loc)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">{loc.name}</div>
                  <div className="text-[11px] text-slate-500">{loc.area}</div>
                </div>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}

            {filteredLocalities.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching locality found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
