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
    } catch (err: any) {
      console.warn('Geolocation failed:', err.message);
      setErrorMessage(
        'Unable to acquire device location. Please allow browser location access or select a locality below.'
      );
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
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleClearLocation = () => {
    clearSessionLocation();
    const updated: LocationState = {
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: 5,
    };
    onChange(updated);
  };

  const filteredLocalities = KNOWN_LOCALITIES.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const isLocationActive =
    location.type !== 'none' && location.latitude !== null && location.longitude !== null;

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Active Location Display Tag */}
      {isLocationActive ? (
        <div className="inline-flex items-center space-x-2 bg-amber-400/10 border border-amber-400/25 text-amber-300 px-3 py-1.5 text-xs font-mono rounded-lg shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-medium text-cream-100">{location.name}</span>
          <span className="text-amber-400/70 font-mono text-[11px]">• {location.radiusKm} km</span>

          <button
            type="button"
            onClick={handleClearLocation}
            aria-label="Remove location filter"
            className="p-0.5 ml-1 text-cream-200/50 hover:text-cream-100 transition-colors"
            title="Reset to all locations"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Action Buttons: Near Me & Select Locality */
        <div className="inline-flex items-center space-x-2">
          <button
            type="button"
            onClick={handleNearMeClick}
            disabled={isLocating}
            aria-label="Use current location"
            className={`inline-flex items-center space-x-1.5 bg-[#18120F] border border-cream-200/20 hover:bg-[#201814] hover:border-amber-400/50 text-cream-100 font-sans text-xs uppercase tracking-wider rounded-lg transition-all ${
              size === 'compact' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5'
            }`}
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-label="Select location from list"
            className={`inline-flex items-center space-x-1.5 bg-[#18120F] border border-cream-200/20 hover:bg-[#201814] hover:border-amber-400/50 text-cream-100 font-sans text-xs uppercase tracking-wider rounded-lg transition-all ${
              size === 'compact' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Locality</span>
            <ChevronDown className="w-3 h-3 text-cream-200/40 ml-0.5" />
          </button>
        </div>
      )}

      {/* Permission Denied / Error Toast */}
      {errorMessage && (
        <div
          role="alert"
          className="absolute z-50 left-0 mt-2 w-72 bg-[#1C1410] border border-amber-500/40 text-cream-100 text-xs p-3.5 rounded-xl shadow-2xl flex items-start space-x-2.5"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-mono uppercase tracking-wider text-[10px] text-amber-300 font-semibold">Location Notice</p>
            <p className="mt-0.5 text-cream-200/70 leading-relaxed text-xs">{errorMessage}</p>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsDropdownOpen(true);
              }}
              className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Choose a locality instead →
            </button>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error notice"
            className="text-cream-200/40 hover:text-cream-100 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Localities Selection Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 left-0 mt-2 w-64 sm:w-72 bg-[#16110E] border border-cream-200/15 shadow-2xl rounded-xl overflow-hidden py-1 divide-y divide-cream-200/10 backdrop-blur-md">
          <div className="p-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-cream-200/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area (e.g. Salt Lake)..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0D0A08] border border-cream-200/20 text-cream-100 placeholder-cream-200/40 rounded-lg focus:outline-none focus:border-amber-400/70"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filteredLocalities.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-cream-200/40">
                No matching localities found.
              </div>
            ) : (
              filteredLocalities.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectLocality(loc)}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-cream-100/[0.08] flex items-center justify-between text-cream-200 hover:text-amber-300 transition-colors"
                >
                  <span className="font-serif font-normal">{loc.name}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/40">Kolkata</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
