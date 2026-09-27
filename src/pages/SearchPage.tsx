import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchFilters } from '../components/search/SearchFilters';
import { FoodResultCard } from '../components/search/FoodResultCard';
import { RestaurantResultCard } from '../components/search/RestaurantResultCard';
import { EmptySearchState } from '../components/search/EmptySearchState';
import { SearchErrorState } from '../components/search/SearchErrorState';
import { Pagination } from '../components/search/Pagination';
import {
  executeUnifiedSearch,
  UnifiedSearchResult,
  SearchFilters as FilterType,
} from '../services/searchService';
import {
  LocationState,
  loadSessionLocation,
  saveSessionLocation,
  resolveLocationQuery,
  DEFAULT_RADIUS_KM,
  validateCoordinates,
  getCurrentLocation,
} from '../../src/utils/geolocation';
import { Utensils, Store, MapPin, Layers, Loader2, Navigation } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const PAGE_SIZE = 12;

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract params from URL
  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as 'all' | 'foods' | 'restaurants' | 'locations') || 'all';
  const vegParam = (searchParams.get('veg') as 'all' | 'veg' | 'non_veg') || 'all';
  const availableParam = searchParams.get('available') === 'true';
  const openNowParam = searchParams.get('openNow') === 'true';
  const minPriceParam = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
  const maxPriceParam = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
  const pageParam = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
  const locationParam = searchParams.get('location') || '';
  const radiusParam = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : DEFAULT_RADIUS_KM;
  const sortByParam = (searchParams.get('sortBy') as 'nearest' | 'relevance' | 'price_asc' | 'price_desc') || null;

  // Location State
  const [locationState, setLocationState] = useState<LocationState>(() => {
    // 1. If location param is 'near-me'
    if (locationParam === 'near-me') {
      const saved = loadSessionLocation();
      if (saved && saved.type === 'current' && saved.latitude && saved.longitude) {
        return { ...saved, radiusKm: radiusParam };
      }
      return {
        type: 'current',
        name: 'Near Me',
        latitude: null,
        longitude: null,
        radiusKm: radiusParam,
      };
    }

    // 2. If location param matches a known locality
    if (locationParam) {
      const resolved = resolveLocationQuery(locationParam);
      if (resolved) {
        return {
          type: 'manual',
          name: resolved.name,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          radiusKm: radiusParam,
        };
      }
    }

    // 3. Fallback: check session location if any
    const saved = loadSessionLocation();
    if (saved && saved.type !== 'none' && saved.latitude && saved.longitude) {
      return { ...saved, radiusKm: radiusParam };
    }

    return {
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: radiusParam,
    };
  });

  // Search Results & States
  const [results, setResults] = useState<UnifiedSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const seoOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';
  useSEO({
    title: queryParam
      ? `Search: "${queryParam}"`
      : locationParam
      ? `Food & Restaurants near ${locationState.name}`
      : 'Search Food, Menus & Restaurants',
    description: 'Find real food items, portion variant prices, and open restaurants across the city.',
    canonicalUrl: `${seoOrigin}/search`,
    ogType: 'website',
  });

  // If user navigated with location=near-me but coordinates are not yet loaded in session, request them
  useEffect(() => {
    if (locationParam === 'near-me' && (locationState.latitude === null || locationState.longitude === null)) {
      getCurrentLocation()
        .then((coords) => {
          const updated: LocationState = {
            type: 'current',
            name: 'Near Me',
            latitude: coords.latitude,
            longitude: coords.longitude,
            radiusKm: radiusParam,
          };
          saveSessionLocation(updated);
          setLocationState(updated);
        })
        .catch((err) => {
          console.warn('Geolocation request failed:', err.message);
        });
    }
  }, [locationParam, locationState.latitude, locationState.longitude, radiusParam]);

  const isLocationActive =
    locationState.type !== 'none' &&
    locationState.latitude !== null &&
    locationState.longitude !== null &&
    validateCoordinates(locationState.latitude, locationState.longitude);

  // Filters state reconstructed from URL & location
  const currentFilters: FilterType = useMemo(
    () => ({
      vegType: vegParam,
      availableOnly: availableParam,
      openNow: openNowParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      tab: tabParam,
      latitude: isLocationActive ? locationState.latitude : null,
      longitude: isLocationActive ? locationState.longitude : null,
      radiusKm: isLocationActive ? locationState.radiusKm : undefined,
      locationName: isLocationActive ? locationState.name : undefined,
      sortBy: sortByParam || (isLocationActive ? 'nearest' : 'relevance'),
    }),
    [
      vegParam,
      availableParam,
      openNowParam,
      minPriceParam,
      maxPriceParam,
      tabParam,
      isLocationActive,
      locationState.latitude,
      locationState.longitude,
      locationState.radiusKm,
      locationState.name,
      sortByParam,
    ]
  );

  // Perform search query
  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await executeUnifiedSearch(queryParam, currentFilters, pageParam, PAGE_SIZE);
      setResults(data);
    } catch (err: any) {
      console.error('Search execution failed:', err);
      setErrorMessage(err.message || 'Unable to retrieve search results. Please try again.');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryParam, currentFilters, pageParam]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update query in URL
  const handleSearchSubmit = (newQuery: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newQuery) {
      nextParams.set('q', newQuery);
    } else {
      nextParams.delete('q');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Update location in URL and state
  const handleLocationChange = (newLocation: LocationState) => {
    setLocationState(newLocation);
    const nextParams = new URLSearchParams(searchParams);

    if (newLocation.type === 'current') {
      nextParams.set('location', 'near-me');
      nextParams.set('radius', String(newLocation.radiusKm));
      nextParams.set('sortBy', 'nearest');
    } else if (newLocation.type === 'manual') {
      nextParams.set('location', newLocation.name);
      nextParams.set('radius', String(newLocation.radiusKm));
      nextParams.set('sortBy', 'nearest');
    } else {
      nextParams.delete('location');
      nextParams.delete('radius');
      nextParams.delete('sortBy');
    }

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Update filters in URL
  const handleFilterChange = (newFilters: FilterType) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.vegType && newFilters.vegType !== 'all') {
      nextParams.set('veg', newFilters.vegType);
    } else {
      nextParams.delete('veg');
    }

    if (newFilters.availableOnly) {
      nextParams.set('available', 'true');
    } else {
      nextParams.delete('available');
    }

    if (newFilters.openNow) {
      nextParams.set('openNow', 'true');
    } else {
      nextParams.delete('openNow');
    }

    if (newFilters.minPrice !== null && newFilters.minPrice !== undefined && newFilters.minPrice > 0) {
      nextParams.set('minPrice', String(newFilters.minPrice));
    } else {
      nextParams.delete('minPrice');
    }

    if (newFilters.maxPrice !== null && newFilters.maxPrice !== undefined && newFilters.maxPrice > 0) {
      nextParams.set('maxPrice', String(newFilters.maxPrice));
    } else {
      nextParams.delete('maxPrice');
    }

    if (newFilters.sortBy) {
      nextParams.set('sortBy', newFilters.sortBy);
    } else {
      nextParams.delete('sortBy');
    }

    if (newFilters.radiusKm) {
      nextParams.set('radius', String(newFilters.radiusKm));
    }

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Update active tab in URL
  const handleTabChange = (newTab: 'all' | 'foods' | 'restaurants' | 'locations') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', newTab);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Update pagination in URL
  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters =
    (currentFilters.vegType && currentFilters.vegType !== 'all') ||
    currentFilters.availableOnly ||
    (currentFilters.minPrice !== null && currentFilters.minPrice !== undefined && currentFilters.minPrice > 0) ||
    (currentFilters.maxPrice !== null && currentFilters.maxPrice !== undefined && currentFilters.maxPrice > 0) ||
    currentFilters.openNow ||
    isLocationActive;

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams();
    if (queryParam) nextParams.set('q', queryParam);
    if (tabParam) nextParams.set('tab', tabParam);
    nextParams.set('page', '1');
    setSearchParams(nextParams);

    setLocationState({
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: 5,
    });
  };

  const handleIncreaseRadius = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('radius', '10');
    setSearchParams(nextParams);
    setLocationState((prev) => ({ ...prev, radiusKm: 10 }));
  };

  // Category counts
  const foodCount = results?.foods.length || 0;
  const restCount = results?.restaurants.length || 0;
  const locCount = results?.locations.length || 0;
  const totalCount = results?.totalCount || 0;

  const activeTab = tabParam;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Search Controls */}
      <div className="max-w-3xl mx-auto mb-6">
        <SearchBar
          initialValue={queryParam}
          onSearch={handleSearchSubmit}
          isLoading={isLoading}
          autoFocus={!queryParam && !isLocationActive}
          size="large"
          placeholder="Search food or restaurant"
        />
      </div>

      {/* Main Filter & Location Controls */}
      <div className="mb-6">
        <SearchFilters
          filters={currentFilters}
          onChange={handleFilterChange}
          location={locationState}
          onLocationChange={handleLocationChange}
          totalResultsCount={totalCount}
        />
      </div>

      {/* Results Header & Category Tabs */}
      {!isLoading && !errorMessage && totalCount > 0 && (
        <div className="border-b border-white/10 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-light text-[#F4F2ED] tracking-tight flex items-center space-x-3">
                {isLocationActive && <Navigation className="w-5 h-5 text-[#C5A064] flex-shrink-0" />}
                <span>
                  {queryParam && isLocationActive
                    ? `Results for "${queryParam}" near ${locationState.name}`
                    : queryParam
                    ? `Results for "${queryParam}"`
                    : isLocationActive
                    ? `Nearby Kitchens near ${locationState.name}`
                    : 'Atelier Search Results'}
                </span>
              </h1>
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400 mt-1">
                Telemetry: {totalCount} matching {totalCount === 1 ? 'specimen' : 'specimens'}
                {isLocationActive ? ` within ${locationState.radiusKm} km radius` : ' across curated network'}
              </p>
            </div>

            {results?.prominentCategory && results.prominentCategory !== 'none' && (
              <span className="self-start sm:self-auto text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#C5A064]/10 text-[#C5A064] border border-[#C5A064]/30">
                Optimal Match:{' '}
                <span className="font-bold text-[#F4F2ED] uppercase">
                  {results.prominentCategory}
                </span>
              </span>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeTab === 'all'
                  ? 'bg-[#C5A064]/20 border-[#C5A064]/50 text-[#F4F2ED] shadow-sm font-semibold'
                  : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#C5A064]" />
              <span>All Results</span>
              <span className="text-[10px] opacity-70 font-mono">({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('foods')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeTab === 'foods'
                  ? 'bg-[#C5A064]/20 border-[#C5A064]/50 text-[#F4F2ED] shadow-sm font-semibold'
                  : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-[#C5A064]" />
              <span>Food Items</span>
              <span className="text-[10px] opacity-70 font-mono">({foodCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('restaurants')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeTab === 'restaurants'
                  ? 'bg-[#C5A064]/20 border-[#C5A064]/50 text-[#F4F2ED] shadow-sm font-semibold'
                  : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#C5A064]" />
              <span>Kitchens</span>
              <span className="text-[10px] opacity-70 font-mono">({restCount})</span>
            </button>

            {!isLocationActive && locCount > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange('locations')}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                  activeTab === 'locations'
                    ? 'bg-[#C5A064]/20 border-[#C5A064]/50 text-[#F4F2ED] shadow-sm font-semibold'
                    : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#C5A064]" />
                <span>Locations</span>
                <span className="text-[10px] opacity-70 font-mono">({locCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A064] mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {isLocationActive ? `Calibrating network within ${locationState.radiusKm} km...` : 'Querying atelier database...'}
          </p>
        </div>
      ) : errorMessage ? (
        <SearchErrorState message={errorMessage} onRetry={performSearch} />
      ) : !queryParam && !hasActiveFilters && !isLocationActive ? (
        <EmptySearchState onSuggestedQuery={handleSearchSubmit} />
      ) : totalCount === 0 ? (
        <EmptySearchState
          query={queryParam}
          hasActiveFilters={hasActiveFilters}
          hasLocationFilter={isLocationActive}
          locationName={locationState.name}
          radiusKm={locationState.radiusKm}
          onClearFilters={handleClearFilters}
          onIncreaseRadius={handleIncreaseRadius}
          onSuggestedQuery={handleSearchSubmit}
        />
      ) : (
        <div className="space-y-12">
          {/* TAB 1: ALL RESULTS */}
          {activeTab === 'all' && (
            <div className="space-y-12">
              {/* Prominent Food Results */}
              {results && results.foods.length > 0 && (
                <section aria-labelledby="section-foods">
                  <div className="flex items-center justify-between mb-5">
                    <h2 id="section-foods" className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] flex items-center space-x-2.5">
                      <Utensils className="w-4 h-4 text-[#C5A064]" />
                      <span>Curated Food Items ({results.foods.length})</span>
                    </h2>
                    {results.foods.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('foods')}
                        className="text-xs font-mono uppercase tracking-widest text-[#C5A064] hover:text-white transition-colors"
                      >
                        View all foods →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {results.foods.slice(0, 6).map((food) => (
                      <FoodResultCard key={food.id} item={food} />
                    ))}
                  </div>
                </section>
              )}

              {/* Prominent Restaurant Results */}
              {results && results.restaurants.length > 0 && (
                <section aria-labelledby="section-restaurants">
                  <div className="flex items-center justify-between mb-5">
                    <h2 id="section-restaurants" className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] flex items-center space-x-2.5">
                      <Store className="w-4 h-4 text-[#C5A064]" />
                      <span>
                        {isLocationActive ? `Ateliers near ${locationState.name} (${results.restaurants.length})` : `Curated Kitchens (${results.restaurants.length})`}
                      </span>
                    </h2>
                    {results.restaurants.length > 4 && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('restaurants')}
                        className="text-xs font-mono uppercase tracking-widest text-[#C5A064] hover:text-white transition-colors"
                      >
                        View all kitchens →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {results.restaurants.slice(0, 6).map((rest) => (
                      <RestaurantResultCard key={rest.id} restaurant={rest} />
                    ))}
                  </div>
                </section>
              )}

              {/* Matching Location Text Results (Only when no coordinates active) */}
              {!isLocationActive && results && results.locations.length > 0 && (
                <section aria-labelledby="section-locations">
                  <div className="flex items-center justify-between mb-5">
                    <h2 id="section-locations" className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-[#C5A064]" />
                      <span>Kitchens in Locality ({results.locations.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {results.locations.slice(0, 6).map((rest) => (
                      <RestaurantResultCard key={`loc-${rest.id}`} restaurant={rest} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* TAB 2: FOOD ITEMS ONLY */}
          {activeTab === 'foods' && (
            <section aria-label="Food search results">
              {results && results.foods.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.foods.map((food) => (
                      <FoodResultCard key={food.id} item={food} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pageParam}
                    totalItems={results.foods.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    className="mt-6"
                  />
                </>
              ) : (
                <EmptySearchState
                  query={queryParam}
                  hasActiveFilters={hasActiveFilters}
                  hasLocationFilter={isLocationActive}
                  locationName={locationState.name}
                  radiusKm={locationState.radiusKm}
                  onClearFilters={handleClearFilters}
                  onIncreaseRadius={handleIncreaseRadius}
                  onSuggestedQuery={handleSearchSubmit}
                />
              )}
            </section>
          )}

          {/* TAB 3: RESTAURANTS ONLY */}
          {activeTab === 'restaurants' && (
            <section aria-label="Restaurant search results">
              {results && results.restaurants.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.restaurants.map((rest) => (
                      <RestaurantResultCard key={rest.id} restaurant={rest} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pageParam}
                    totalItems={results.restaurants.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    className="mt-6"
                  />
                </>
              ) : (
                <EmptySearchState
                  query={queryParam}
                  hasActiveFilters={hasActiveFilters}
                  hasLocationFilter={isLocationActive}
                  locationName={locationState.name}
                  radiusKm={locationState.radiusKm}
                  onClearFilters={handleClearFilters}
                  onIncreaseRadius={handleIncreaseRadius}
                  onSuggestedQuery={handleSearchSubmit}
                />
              )}
            </section>
          )}

          {/* TAB 4: LOCATIONS ONLY */}
          {activeTab === 'locations' && (
            <section aria-label="Location search results">
              {results && results.locations.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.locations.map((rest) => (
                      <RestaurantResultCard key={`loc-page-${rest.id}`} restaurant={rest} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pageParam}
                    totalItems={results.locations.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    className="mt-6"
                  />
                </>
              ) : (
                <EmptySearchState
                  query={queryParam}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onSuggestedQuery={handleSearchSubmit}
                />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
