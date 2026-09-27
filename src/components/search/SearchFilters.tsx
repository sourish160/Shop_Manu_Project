import React, { useState } from 'react';
import { Filter, Check, Clock, RotateCcw, ArrowUpDown } from 'lucide-react';
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
    <aside aria-label="Search filters and location controls" className={`w-full ${className}`}>
      {/* Location Bar & Mobile Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
        <div className="md:hidden flex items-center justify-between pt-2 border-t border-slate-100 sm:border-none sm:pt-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="inline-flex items-center space-x-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              aria-expanded={isMobileDrawerOpen}
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-semibold rounded-full bg-slate-900 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {totalResultsCount !== undefined && totalResultsCount > 0 && (
              <span className="text-xs text-slate-500">
                {totalResultsCount} items
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
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
          isMobileDrawerOpen ? 'block mt-3 p-4 bg-white border border-slate-200 rounded-lg shadow-sm' : 'hidden'
        } md:block pt-3`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-4 text-sm">
          {/* Diet Filter: All / Veg / Non-Veg */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Diet:</span>
            <div className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => handleVegChange('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  !filters.vegType || filters.vegType === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleVegChange('veg')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                  filters.vegType === 'veg'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
                <span>Veg</span>
              </button>
              <button
                type="button"
                onClick={() => handleVegChange('non_veg')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                  filters.vegType === 'non_veg'
                    ? 'bg-amber-700 text-white shadow-sm font-semibold'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                <span>Non-Veg</span>
              </button>
            </div>
          </div>

          {/* Quick Toggles: Available Only & Open Now */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAvailabilityToggle}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                filters.availableOnly
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {filters.availableOnly && <Check className="w-3 h-3 text-white" />}
              <span>Available Only</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNowToggle}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                filters.openNow
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Open Now</span>
            </button>
          </div>

          {/* Price Range Filter */}
          <form
            onSubmit={handleApplyPriceFilter}
            className="flex items-center space-x-2 text-xs"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (₹):</span>
            <label htmlFor="filter-min-price" className="sr-only">Minimum price in rupees</label>
            <input
              id="filter-min-price"
              type="number"
              min="0"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-slate-400">to</span>
            <label htmlFor="filter-max-price" className="sr-only">Maximum price in rupees</label>
            <input
              id="filter-max-price"
              type="number"
              min="0"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-medium transition-colors"
            >
              Apply
            </button>
          </form>

          {/* Sort By Selector */}
          <div className="flex items-center space-x-1.5 text-xs">
            <label htmlFor="filter-sort-by" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort:</span>
            </label>
            <select
              id="filter-sort-by"
              value={filters.sortBy || (isLocationActive ? 'nearest' : 'relevance')}
              onChange={handleSortChange}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium cursor-pointer"
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
              className="hidden md:inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-900 ml-auto transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
