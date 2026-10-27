import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchFilters } from '../components/search/SearchFilters';
import { FoodResultCard } from '../components/search/FoodResultCard';
import { RestaurantResultCard } from '../components/search/RestaurantResultCard';
import { EmptySearchState } from '../components/search/EmptySearchState';
import { SearchErrorState } from '../components/search/SearchErrorState';
import { Pagination } from '../components/search/Pagination';
import { PriceComparisonView } from '../components/search/PriceComparisonView';
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
import { Utensils, Store, MapPin, Layers, Loader2, Navigation, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { sanitizeErrorMessage } from '../utils/errorHandler';

const PAGE_SIZE = 12;

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract params from URL
  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as 'all' | 'foods' | 'restaurants' | 'locations') || 'all';
  const categoryParam = searchParams.get('category') || '';
  const viewModeParam = (searchParams.get('view') as 'grid' | 'comparison') || 'grid';
  const vegParam = (searchParams.get('veg') as 'all' | 'veg' | 'non_veg') || 'all';
  const availableParam = searchParams.get('available') === 'true';
  const openNowParam = searchParams.get('openNow') === 'true';
  const minPriceParam = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
  const maxPriceParam = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
  const pageParam = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
  const locationParam = searchParams.get('location') || '';
  const radiusParam = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : DEFAULT_RADIUS_KM;
  const sortByParam = (searchParams.get('sortBy') as 'nearest' | 'relevance' | 'price_asc' | 'price_desc') || null;

  // View Mode: Grid (responsive cards) or Comparison (side-by-side portion prices across shops)
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>(viewModeParam);

  // Location State
  const [locationState, setLocationState] = useState<LocationState>(() => {
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

  const isNearMePendingConsent =
    locationParam === 'near-me' &&
    (locationState.latitude === null || locationState.longitude === null);

  const handleGrantLocationConsent = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const coords = await getCurrentLocation();
      const updated: LocationState = {
        type: 'current',
        name: 'Near Me',
        latitude: coords.latitude,
        longitude: coords.longitude,
        radiusKm: radiusParam,
      };
      saveSessionLocation(updated);
      setLocationState(updated);
    } catch (err: unknown) {
      setErrorMessage(sanitizeErrorMessage(err, 'Location access was not allowed. Search a location instead.'));
    } finally {
      setIsLoading(false);
    }
  };

  const isLocationActive =
    locationState.type !== 'none' &&
    locationState.latitude !== null &&
    locationState.longitude !== null &&
    validateCoordinates(locationState.latitude, locationState.longitude);

  const currentFilters: FilterType = useMemo(
    () => ({
      category: categoryParam || undefined,
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
      categoryParam,
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

  const latestRequestIdRef = useRef<number>(0);

  const performSearch = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await executeUnifiedSearch(queryParam, currentFilters, pageParam, PAGE_SIZE);
      if (requestId === latestRequestIdRef.current) {
        setResults(data);
      }
    } catch (err: unknown) {
      if (requestId === latestRequestIdRef.current) {
        console.error('Search execution failed:', err);
        setErrorMessage(sanitizeErrorMessage(err, 'Unable to retrieve search results. Please try again.'));
        setResults(null);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryParam, currentFilters, pageParam]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

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

  const handleFilterChange = (newFilters: FilterType) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.category) {
      nextParams.set('category', newFilters.category);
    } else {
      nextParams.delete('category');
    }

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

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleTabChange = (newTab: 'all' | 'foods' | 'restaurants' | 'locations') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', newTab);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleViewModeChange = (mode: 'grid' | 'comparison') => {
    setViewMode(mode);
    const nextParams = new URLSearchParams(searchParams);
    if (mode === 'comparison') {
      nextParams.set('view', 'comparison');
    } else {
      nextParams.delete('view');
    }
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters =
    Boolean(categoryParam) ||
    (vegParam && vegParam !== 'all') ||
    availableParam ||
    openNowParam ||
    minPriceParam !== null ||
    maxPriceParam !== null ||
    isLocationActive;

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams();
    if (queryParam) nextParams.set('q', queryParam);
    setSearchParams(nextParams);

    setLocationState({
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: 5,
    });
    setViewMode('grid');
  };

  const handleIncreaseRadius = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('radius', '10');
    setSearchParams(nextParams);
    setLocationState((prev) => ({ ...prev, radiusKm: 10 }));
  };

  // Compute how many dishes appear in 2 or more distinct restaurants
  const comparableGroupsCount = useMemo(() => {
    if (!results || !results.foods || results.foods.length < 2) return 0;
    const dishToShops = new Map<string, Set<string>>();
    results.foods.forEach((food) => {
      const key = food.name.toLowerCase().trim();
      const shopSet = dishToShops.get(key) || new Set<string>();
      shopSet.add(food.restaurant.id);
      dishToShops.set(key, shopSet);
    });
    let count = 0;
    dishToShops.forEach((shops) => {
      if (shops.size >= 2) count++;
    });
    return count;
  }, [results]);

  const foodCount = results?.foods.length || 0;
  const restCount = results?.restaurants.length || 0;
  const locCount = results?.locations.length || 0;
  const totalCount = results?.totalCount || 0;

  const activeTab = tabParam;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back Breadcrumb to Cinematic Chapters */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-cream-200/60 hover:text-amber-300 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Story Chapters</span>
        </Link>
      </div>

      {/* Editorial Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="font-mono text-[10px] sm:text-[11px] text-amber-400 font-semibold tracking-[0.25em] uppercase">
            Discovery Catalogue · Real Menus & Portions
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-cream-100 tracking-tight leading-tight mb-4">
          Find your next bite,{' '}
          <span className="italic bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent">
            verified portion by portion.
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-cream-200/75 font-sans leading-relaxed max-w-xl mx-auto">
          Explore transparent digital menus, compare real dish portion prices, and discover participating local shops with zero algorithmic markups.
        </p>
      </div>

      {/* Top Search Controls */}
      <div className="max-w-3xl mx-auto mb-6">
        <SearchBar
          initialValue={queryParam}
          onSearch={handleSearchSubmit}
          isLoading={isLoading}
          autoFocus={!queryParam && !isLocationActive}
          size="large"
          placeholder="Search dishes, portions, or food shops..."
        />

        {/* Quick Discovery Category & Area Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-3.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cream-200/50 mr-1">
            Discover:
          </span>
          {[
            { label: 'Biryani Specials', query: 'Biryani' },
            { label: 'Kathi Rolls', query: 'Roll' },
            { label: 'Tandoor & Kebabs', query: 'Kebab' },
            { label: 'Pure Veg', veg: 'veg' },
            { label: 'Park Street', location: 'Park Street' },
            { label: 'Salt Lake', location: 'Salt Lake' },
          ].map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => {
                if (pill.query) handleSearchSubmit(pill.query);
                else if (pill.veg) handleFilterChange({ ...currentFilters, vegType: 'veg' });
                else if (pill.location) {
                  const resolved = resolveLocationQuery(pill.location);
                  if (resolved) {
                    handleLocationChange({
                      type: 'manual',
                      name: resolved.name,
                      latitude: resolved.latitude,
                      longitude: resolved.longitude,
                      radiusKm: 5,
                    });
                  }
                }
              }}
              className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-cream-100/[0.04] hover:bg-amber-400 hover:text-[#0A0807] border border-cream-200/12 text-cream-200/80 transition-all cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter & Location Controls */}
      <div className="mb-8">
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
        <div className="border-b border-cream-200/10 pb-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block mb-1">
                DISCOVERY CATALOGUE
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 tracking-tight flex items-center space-x-2.5">
                {isLocationActive && <Navigation className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                <span>
                  {queryParam && isLocationActive
                    ? `Results for "${queryParam}" near ${locationState.name}`
                    : queryParam
                    ? `Results for "${queryParam}"`
                    : categoryParam
                    ? `Dishes in Category "${categoryParam}"`
                    : isLocationActive
                    ? `Food Shops near ${locationState.name}`
                    : 'Search Results'}
                </span>
              </h2>
              <p className="font-mono text-xs text-cream-200/50 mt-1">
                Found {totalCount} matching {totalCount === 1 ? 'item' : 'items'}
                {isLocationActive ? ` within ${locationState.radiusKm} km radius` : ' across registered food shops'}
              </p>
            </div>

            {/* View Mode Toggle: Grid Cards vs Side-by-Side Portion Price Comparison */}
            {results && results.foods.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-[#0E0B09] border border-cream-200/15 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('grid')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-amber-400 text-[#0A0807] font-semibold shadow-sm'
                      : 'text-cream-200/70 hover:text-cream-100'
                  }`}
                >
                  Grid View
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('comparison')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md transition-all flex items-center space-x-1.5 ${
                    viewMode === 'comparison'
                      ? 'bg-amber-400 text-[#0A0807] font-semibold shadow-sm'
                      : 'text-cream-200/70 hover:text-cream-100'
                  }`}
                >
                  <span>Compare Prices</span>
                  {comparableGroupsCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        viewMode === 'comparison'
                          ? 'bg-[#0A0807]/20 text-[#0A0807]'
                          : 'bg-amber-400/20 text-amber-300'
                      }`}
                    >
                      {comparableGroupsCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2.5 overflow-x-auto scrollbar-none pb-1">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap border ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 border-amber-500 font-semibold shadow-md'
                  : 'bg-[#14100D] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Results</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'all' ? 'bg-espresso-950/20 text-espresso-950 font-bold' : 'bg-amber-400/10 text-amber-300'}`}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('foods')}
              className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap border ${
                activeTab === 'foods'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 border-amber-500 font-semibold shadow-md'
                  : 'bg-[#14100D] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Food Items</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'foods' ? 'bg-espresso-950/20 text-espresso-950 font-bold' : 'bg-amber-400/10 text-amber-300'}`}>
                {foodCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('restaurants')}
              className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap border ${
                activeTab === 'restaurants'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 border-amber-500 font-semibold shadow-md'
                  : 'bg-[#14100D] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Food Shops</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'restaurants' ? 'bg-espresso-950/20 text-espresso-950 font-bold' : 'bg-amber-400/10 text-amber-300'}`}>
                {restCount}
              </span>
            </button>

            {!isLocationActive && locCount > 0 && (
              <button
                type="button"
                onClick={() => handleTabChange('locations')}
                className={`inline-flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap border ${
                  activeTab === 'locations'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 border-amber-500 font-semibold shadow-md'
                    : 'bg-[#14100D] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>By Locality</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'locations' ? 'bg-espresso-950/20 text-espresso-950 font-bold' : 'bg-amber-400/10 text-amber-300'}`}>
                  {locCount}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Privacy-First Location Consent Prompt */}
      {isNearMePendingConsent && (
        <div className="editorial-card mb-8 p-6 bg-[#14100D] border border-amber-400/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 bg-amber-400/10 border border-amber-400/25 rounded-lg flex items-center justify-center text-amber-400 shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-cream-100">
                Enable Location for "Near Me" Results
              </h3>
              <p className="text-xs text-cream-200/70 mt-0.5 leading-relaxed font-sans">
                Privacy-first: We only access neighborhood-level coordinates for this session. Your location is never logged or stored.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGrantLocationConsent}
            className="self-start sm:self-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-espresso-950 font-sans text-xs uppercase tracking-wider font-semibold rounded-lg shadow-md transition-all shrink-0"
          >
            Detect My Location
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-cream-200/60">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-4" />
          <p className="font-mono text-xs uppercase tracking-widest text-cream-200/60">
            {isLocationActive ? `Searching food shops within ${locationState.radiusKm} km...` : 'Searching digital menus...'}
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
              {/* Food Results */}
              {results && results.foods.length > 0 && (
                <section aria-labelledby="section-foods">
                  <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-cream-200/10">
                    <h3 id="section-foods" className="font-serif text-xl sm:text-2xl font-normal text-cream-100 flex items-center space-x-2">
                      <Utensils className="w-4 h-4 text-amber-400" />
                      <span>
                        {viewMode === 'comparison' ? 'Portion Price Comparison' : 'Food Items'} ({results.foods.length})
                      </span>
                    </h3>
                    {results.foods.length > 6 && viewMode === 'grid' && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('foods')}
                        className="text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        <span>View all {results.foods.length} items</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {viewMode === 'comparison' ? (
                    <PriceComparisonView foods={results.foods} onSuggestedQuery={handleSearchSubmit} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.foods.slice(0, 6).map((food) => (
                        <FoodResultCard key={food.id} item={food} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Restaurant Results */}
              {results && results.restaurants.length > 0 && (
                <section aria-labelledby="section-restaurants">
                  <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-cream-200/10">
                    <h3 id="section-restaurants" className="font-serif text-xl sm:text-2xl font-normal text-cream-100 flex items-center space-x-2">
                      <Store className="w-4 h-4 text-amber-400" />
                      <span>
                        {isLocationActive ? `Food Shops near ${locationState.name} (${results.restaurants.length})` : `Food Shops (${results.restaurants.length})`}
                      </span>
                    </h3>
                    {results.restaurants.length > 6 && (
                      <button
                        type="button"
                        onClick={() => handleTabChange('restaurants')}
                        className="text-xs font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                      >
                        <span>View all {results.restaurants.length} shops</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.restaurants.slice(0, 6).map((rest) => (
                      <RestaurantResultCard key={rest.id} restaurant={rest} />
                    ))}
                  </div>
                </section>
              )}

              {/* Matching Location Text Results */}
              {!isLocationActive && results && results.locations.length > 0 && (
                <section aria-labelledby="section-locations">
                  <div className="flex items-center justify-between mb-6 pb-2.5 border-b border-cream-200/10">
                    <h3 id="section-locations" className="font-serif text-xl sm:text-2xl font-normal text-cream-100 flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>Shops in Matching Locality ({results.locations.length})</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {viewMode === 'comparison' ? (
                    <PriceComparisonView foods={results.foods} onSuggestedQuery={handleSearchSubmit} />
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.foods.map((food) => (
                          <FoodResultCard key={food.id} item={food} />
                        ))}
                      </div>
                      <Pagination
                        currentPage={pageParam}
                        totalItems={results.foods.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={handlePageChange}
                        className="mt-10"
                      />
                    </>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.restaurants.map((rest) => (
                      <RestaurantResultCard key={rest.id} restaurant={rest} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pageParam}
                    totalItems={results.restaurants.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    className="mt-10"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.locations.map((rest) => (
                      <RestaurantResultCard key={`loc-page-${rest.id}`} restaurant={rest} />
                    ))}
                  </div>
                  <Pagination
                    currentPage={pageParam}
                    totalItems={results.locations.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    className="mt-10"
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
