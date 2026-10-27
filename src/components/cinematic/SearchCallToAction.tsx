import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Navigation,
  ArrowUpRight,
  Loader2,
  X,
  Utensils,
  Store,
  MapPin,
  Clock,
} from 'lucide-react';
import { fetchSearchSuggestions, SearchSuggestion } from '../../services/searchService';

interface SearchCallToActionProps {
  onSearch: (query: string) => void;
  onNearMe: () => void;
  isLocating: boolean;
  locationError: string | null;
  selectedLocation?: string;
  onQuickChipClick?: (term: string) => void;
  className?: string;
}

const DEFAULT_CATEGORY_CHIPS = [
  'Biryani',
  'Rolls',
  'Kebabs',
  'Park Street',
  'Salt Lake',
  'Open Now',
];

export const SearchCallToAction: React.FC<SearchCallToActionProps> = ({
  onSearch,
  onNearMe,
  isLocating,
  locationError,
  selectedLocation = 'Kolkata',
  onQuickChipClick,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setIsSuggesting(false);
      setHasSearched(false);
      return;
    }

    setIsSuggesting(true);
    setHasSearched(false);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await fetchSearchSuggestions(trimmed);
        setSuggestions(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
        setHasSearched(true);
      }
    }, 240);
  };

  const handleClear = () => {
    setSearchValue('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    onSearch(searchValue.trim());
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setIsDropdownOpen(false);
    setSearchValue(item.title);
    if (item.type === 'location' && onQuickChipClick) {
      onQuickChipClick(item.title);
    } else {
      onSearch(item.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || (suggestions.length === 0 && !hasSearched)) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const renderHighlightedTitle = useCallback((title: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return title;
    const index = title.toLowerCase().indexOf(trimmed.toLowerCase());
    if (index === -1) return title;

    const before = title.slice(0, index);
    const match = title.slice(index, index + trimmed.length);
    const after = title.slice(index + trimmed.length);

    return (
      <>
        {before}
        <span className="text-amber-300 font-semibold underline decoration-amber-400/40 underline-offset-2">
          {match}
        </span>
        {after}
      </>
    );
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input Box */}
      <div ref={containerRef} className="relative w-full max-w-xl mb-4">
        <form onSubmit={handleSubmit} role="search" className="relative">
          <div className="relative flex items-center rounded-xl bg-cream-100/[0.08] border border-cream-200/20 focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:bg-cream-100/[0.13] backdrop-blur-md transition-all p-1.5 group shadow-xl">
            <Search
              className="w-4 h-4 text-cream-200/50 ml-3 shrink-0 group-focus-within:text-amber-300 transition-colors"
              aria-hidden="true"
            />

            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 || (hasSearched && searchValue.trim().length >= 2)) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder="Search dishes, biryani, rolls, or restaurants..."
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-autocomplete="list"
              aria-controls="cta-search-suggestions"
              aria-activedescendant={
                highlightedIndex >= 0 ? `cta-suggestion-${highlightedIndex}` : undefined
              }
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-sans text-cream-100 placeholder-cream-200/40 focus:outline-none"
            />

            {isSuggesting && (
              <Loader2
                className="w-4 h-4 text-amber-400 animate-spin mr-2 shrink-0"
                aria-label="Searching suggestions..."
              />
            )}

            {searchValue.length > 0 && !isSuggesting && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search input"
                className="p-1 mr-1 text-cream-200/40 hover:text-cream-100 transition-colors rounded-md focus-visible:ring-1 focus-visible:ring-amber-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="group shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-espresso-950 font-sans font-semibold text-[11px] sm:text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md hover:shadow-amber-500/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </form>

        {/* Autocomplete Suggestions Popover */}
        {isDropdownOpen && (
          <div
            id="cta-search-suggestions"
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-[#14100E]/95 backdrop-blur-xl border border-cream-200/20 shadow-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              <>
                <div className="px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-widest-2 text-cream-200/40 border-b border-cream-200/10 flex items-center justify-between">
                  <span>Live Database Matches</span>
                  <span className="text-[9px] text-cream-200/30">Use ↑↓ keys to navigate</span>
                </div>
                {suggestions.map((item, index) => {
                  const isHighlighted = highlightedIndex === index;
                  return (
                    <div
                      key={item.id}
                      id={`cta-suggestion-${index}`}
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => handleSelectSuggestion(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                        isHighlighted
                          ? 'bg-cream-100/[0.12] text-cream-50'
                          : 'text-cream-100/90 hover:bg-cream-100/[0.07]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div
                          className={`p-1.5 rounded-md shrink-0 ${
                            item.type === 'food'
                              ? 'bg-amber-400/15 text-amber-300'
                              : item.type === 'restaurant'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-cream-200/15 text-cream-300'
                          }`}
                        >
                          {item.type === 'food' && <Utensils className="w-3.5 h-3.5" />}
                          {item.type === 'restaurant' && <Store className="w-3.5 h-3.5" />}
                          {item.type === 'location' && <MapPin className="w-3.5 h-3.5" />}
                        </div>

                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-sans truncate">
                            {renderHighlightedTitle(item.title, searchValue)}
                          </p>
                          {item.subtitle && (
                            <p className="text-[10px] sm:text-[11px] text-cream-200/50 font-sans truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-cream-200/15 text-cream-200/50 font-mono">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : hasSearched && !isSuggesting && searchValue.trim().length >= 2 ? (
              <div className="px-4 py-3.5 text-xs text-cream-200/70 font-sans flex items-center justify-between">
                <span>
                  No direct matches for &ldquo;{searchValue}&rdquo;. Press Enter to explore all menus.
                </span>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider ml-2 shrink-0"
                >
                  Search All
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Category & Location Discovery Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Near Me Geo-Chip */}
        <button
          type="button"
          onClick={onNearMe}
          disabled={isLocating}
          aria-label="Find restaurants and menus near my location"
          className="px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-sans font-semibold uppercase tracking-widest text-amber-300 border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 hover:border-amber-400/60 transition-all flex items-center space-x-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400 shadow-sm active:scale-[0.98]"
        >
          {isLocating ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
          ) : (
            <Navigation className="w-3 h-3 text-amber-300" />
          )}
          <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
        </button>

        {/* City Chip */}
        {selectedLocation && (
          <button
            type="button"
            onClick={() => onQuickChipClick?.(selectedLocation)}
            aria-label={`Browse restaurants in ${selectedLocation}`}
            className="px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-wider text-amber-200/90 border border-amber-400/25 bg-amber-500/[0.08] hover:text-amber-100 hover:border-amber-400/50 hover:bg-amber-500/[0.15] transition-all flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98]"
          >
            <MapPin className="w-2.5 h-2.5 text-amber-300" />
            <span>{selectedLocation}</span>
          </button>
        )}

        {/* Curated Food & Locality Chips */}
        {DEFAULT_CATEGORY_CHIPS.map((tag) => {
          const isOpenNow = tag === 'Open Now';
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onQuickChipClick?.(tag)}
              aria-label={`Filter by ${tag}`}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-wider transition-all flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98] ${
                isOpenNow
                  ? 'text-emerald-300 border border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16] hover:border-emerald-400/50'
                  : 'text-cream-200/75 border border-cream-200/15 bg-cream-100/[0.05] hover:text-cream-100 hover:border-cream-200/40 hover:bg-cream-100/[0.1]'
              }`}
            >
              {isOpenNow && <Clock className="w-2.5 h-2.5 text-emerald-400" />}
              <span>{tag}</span>
            </button>
          );
        })}
      </div>

      {/* Geolocation feedback error */}
      {locationError && (
        <p
          role="alert"
          className="mt-3 text-[11px] text-amber-300/90 font-sans flex items-center space-x-1.5 bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 rounded-md max-w-xl"
        >
          <MapPin className="w-3 h-3 shrink-0 text-amber-400" />
          <span>{locationError}</span>
        </p>
      )}
    </div>
  );
};
