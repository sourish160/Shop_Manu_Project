import React, { useState } from 'react';
import { Filter, Check, Clock, RotateCcw, ArrowUpDown, Layers } from 'lucide-react';
import { SearchFilters as FilterType } from '../../services/searchService';
import { LocationSelector } from '../location/LocationSelector';
import { RadiusFilter } from '../location/RadiusFilter';
import { LocationState, RadiusOption } from '../../utils/geolocation';

interface SearchFiltersProps {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
  location: LocationState;
  onLocationChange: (newLocation: LocationState) => void;
  className?: string;
  totalResultsCount?: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  location,
  onLocationChange,
  className = '',
  totalResultsCount,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Local state for price inputs
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filters.minPrice !== undefined && filters.minPrice !== null ? String(filters.minPrice) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filters.maxPrice !== undefined && filters.maxPrice !== null ? String(filters.maxPrice) : ''
  );

  const isLocationActive = location.type !== 'none' && location.latitude !== null && location.longitude !== null;

  const activeFiltersCount = [
    isLocationActive,
    filters.vegType && filters.vegType !== 'all',
    filters.category,
    filters.availableOnly,
    filters.minPrice !== null && filters.minPrice !== undefined && filters.minPrice > 0,
    filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice > 0,
    filters.openNow,
    filters.sortBy && filters.sortBy !== 'nearest' && filters.sortBy !== 'relevance',
  ].filter(Boolean).length;

  const handleVegChange = (vegType: 'all' | 'veg' | 'non_veg') => {
    onChange({ ...filters, vegType });
  };

  const handleAvailabilityToggle = () => {
    onChange({ ...filters, availableOnly: !filters.availableOnly });
  };

  const handleOpenNowToggle = () => {
    onChange({ ...filters, openNow: !filters.openNow });
  };

  const handleRadiusChange = (radius: RadiusOption) => {
    onLocationChange({
      ...location,
      radiusKm: radius,
    });
    onChange({
      ...filters,
      radiusKm: radius,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as 'nearest' | 'relevance' | 'price_asc' | 'price_desc';
    onChange({
      ...filters,
      sortBy: val,
    });
  };

  const handleApplyPriceFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minVal = minPriceInput.trim() ? parseFloat(minPriceInput) : null;
    const maxVal = maxPriceInput.trim() ? parseFloat(maxPriceInput) : null;

    onChange({
      ...filters,
      minPrice: minVal !== null && !isNaN(minVal) && minVal >= 0 ? minVal : null,
      maxPrice: maxVal !== null && !isNaN(maxVal) && maxVal >= 0 ? maxVal : null,
    });
  };

  const handleClearFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    onLocationChange({
      type: 'none',
      name: 'Entire City',
      latitude: null,
      longitude: null,
      radiusKm: 5,
    });
    onChange({
      category: undefined,
      vegType: 'all',
      availableOnly: false,
      minPrice: null,
      maxPrice: null,
      openNow: false,
      latitude: null,
      longitude: null,
      radiusKm: 5,
      locationName: undefined,
      sortBy: 'relevance',
    });
  };

  return (
    <aside aria-label="Search filters and location controls" className={`w-full bg-[#120E0C] border border-cream-200/12 rounded-xl p-4 sm:p-5 shadow-xl ${className}`}>
      {/* Location Bar & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-cream-200/10">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/50">
            Location:
          </span>
          <LocationSelector
            location={location}
            onChange={(newLoc) => {
              onLocationChange(newLoc);
              onChange({
                ...filters,
                latitude: newLoc.latitude,
                longitude: newLoc.longitude,
                radiusKm: newLoc.radiusKm,
                locationName: newLoc.name,
                sortBy: newLoc.latitude !== null ? 'nearest' : filters.sortBy || 'relevance',
              });
            }}
          />

          {isLocationActive && (
            <RadiusFilter
              selectedRadius={location.radiusKm}
              onChange={handleRadiusChange}
              className="ml-0 sm:ml-2"
            />
          )}
        </div>

        {/* Mobile Filter Toggle Header */}
        <div className="md:hidden flex items-center justify-between pt-2 border-t border-cream-200/10 sm:border-none sm:pt-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-cream-100 bg-[#1A1410] border border-cream-200/20 px-3 py-1.5 rounded-lg transition-colors"
              aria-expanded={isMobileDrawerOpen}
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[9px] font-mono bg-amber-400 text-espresso-950 font-bold rounded">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {totalResultsCount !== undefined && totalResultsCount > 0 && (
              <span className="text-xs font-mono text-cream-200/50">
                {totalResultsCount} items
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-mono text-cream-200/60 hover:text-amber-300 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options (Always visible on desktop, toggleable on mobile) */}
      <div
        className={`${
          isMobileDrawerOpen ? 'block mt-3 pt-3 border-t border-cream-200/10' : 'hidden'
        } md:block pt-3.5`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-4 text-xs">
          {/* Diet Filter: All / Veg / Non-Veg */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/50">Diet:</span>
            <div className="inline-flex border border-cream-200/15 bg-[#0D0A08] p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleVegChange('all')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                  !filters.vegType || filters.vegType === 'all'
                    ? 'bg-amber-400 text-espresso-950 font-semibold'
                    : 'text-cream-200/70 hover:text-cream-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleVegChange('veg')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center space-x-1.5 ${
                  filters.vegType === 'veg'
                    ? 'bg-amber-400 text-espresso-950 font-semibold'
                    : 'text-cream-200/70 hover:text-cream-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>Veg</span>
              </button>
              <button
                type="button"
                onClick={() => handleVegChange('non_veg')}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center space-x-1.5 ${
                  filters.vegType === 'non_veg'
                    ? 'bg-amber-400 text-espresso-950 font-semibold'
                    : 'text-cream-200/70 hover:text-cream-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>

          {/* Quick Toggles: Available Only & Open Now */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAvailabilityToggle}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors ${
                filters.availableOnly
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 font-medium'
                  : 'bg-cream-100/[0.04] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
              }`}
            >
              {filters.availableOnly && <Check className="w-3 h-3 text-amber-400" />}
              <span>In Stock Only</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNowToggle}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider transition-colors ${
                filters.openNow
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 font-medium'
                  : 'bg-cream-100/[0.04] text-cream-200/70 border-cream-200/15 hover:bg-cream-100/[0.08] hover:text-cream-100'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Open Now</span>
            </button>
          </div>

          {/* Price Range Filter */}
          <form
            onSubmit={handleApplyPriceFilter}
            className="flex items-center space-x-1.5 text-xs font-mono"
          >
            <span className="text-[10px] uppercase tracking-wider text-cream-200/50">Price (₹):</span>
            <label htmlFor="filter-min-price" className="sr-only">Minimum price in rupees</label>
            <input
              id="filter-min-price"
              type="number"
              min="0"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-16 px-2 py-1 bg-[#0A0807] border border-cream-200/20 text-cream-100 placeholder-cream-200/40 rounded text-xs focus:outline-none focus:border-amber-400"
            />
            <span className="text-cream-200/40">to</span>
            <label htmlFor="filter-max-price" className="sr-only">Maximum price in rupees</label>
            <input
              id="filter-max-price"
              type="number"
              min="0"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-16 px-2 py-1 bg-[#0A0807] border border-cream-200/20 text-cream-100 placeholder-cream-200/40 rounded text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-espresso-950 font-semibold rounded transition-colors"
            >
              Apply
            </button>
          </form>

          {/* Category Selector */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <label htmlFor="filter-category" className="text-[10px] uppercase tracking-wider text-cream-200/50 flex items-center space-x-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Category:</span>
            </label>
            <select
              id="filter-category"
              value={filters.category || ''}
              onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
              className="px-2.5 py-1 bg-[#0A0807] border border-cream-200/20 text-cream-100 rounded text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Biryani">Biryani & Rice</option>
              <option value="Roll">Kathi Rolls</option>
              <option value="Kebab">Tandoor & Kebabs</option>
              <option value="Vegetarian">Vegetarian Specialties</option>
              <option value="Main Course">Main Courses</option>
              <option value="Snack">Snacks & Fries</option>
              <option value="Dessert">Breads & Sweets</option>
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <label htmlFor="filter-sort-by" className="text-[10px] uppercase tracking-wider text-cream-200/50 flex items-center space-x-1">
              <ArrowUpDown className="w-3 h-3 text-amber-400" />
              <span>Sort:</span>
            </label>
            <select
              id="filter-sort-by"
              value={filters.sortBy || (isLocationActive ? 'nearest' : 'relevance')}
              onChange={handleSortChange}
              className="px-2.5 py-1 bg-[#0A0807] border border-cream-200/20 text-cream-100 rounded text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {isLocationActive && <option value="nearest">Nearest first</option>}
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Reset Filters on Desktop */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="hidden md:inline-flex items-center space-x-1 text-xs font-mono uppercase tracking-wider text-cream-200/60 hover:text-amber-300 ml-auto transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
