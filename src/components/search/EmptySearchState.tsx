import React from 'react';
import { Search, UtensilsCrossed, MapPin } from 'lucide-react';

interface EmptySearchStateProps {
  query?: string;
  hasActiveFilters?: boolean;
  hasLocationFilter?: boolean;
  locationName?: string;
  radiusKm?: number;
  onClearFilters?: () => void;
  onIncreaseRadius?: () => void;
  onSuggestedQuery?: (suggestion: string) => void;
}

export const EmptySearchState: React.FC<EmptySearchStateProps> = ({
  query,
  hasActiveFilters,
  hasLocationFilter,
  locationName,
  radiusKm,
  onClearFilters,
  onIncreaseRadius,
  onSuggestedQuery,
}) => {
  const isDefaultState = (!query || !query.trim()) && !hasLocationFilter && !hasActiveFilters;

  if (isDefaultState) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center my-6 max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Search for a food or restaurant
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Search for authentic dishes like <span className="font-medium text-slate-800">Chicken Biryani</span>, restaurant names, or click <span className="font-medium text-slate-800">Near Me</span> to discover places around you.
        </p>

        {onSuggestedQuery && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Biryani', 'Kebab', 'Rolls', 'Salt Lake', 'Park Street'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestedQuery(term)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Case 2: Location active but 0 results within radius
  if (hasLocationFilter) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center my-6 max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          No restaurants found nearby
        </h2>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          We couldn't find any approved {query ? `"${query}" results` : 'restaurants'}{' '}
          within <span className="font-semibold text-slate-900">{radiusKm || 5} km</span> of{' '}
          <span className="font-semibold text-slate-900">{locationName || 'your location'}</span>.
        </p>

        <p className="text-xs text-slate-500 mb-6">
          Try increasing your distance radius, searching a different location, or clearing dietary filters.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onIncreaseRadius && (
            <button
              type="button"
              onClick={onIncreaseRadius}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
            >
              Increase radius to 10 km
            </button>
          )}

          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Regular zero results
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center my-6 max-w-xl mx-auto shadow-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-4">
        <UtensilsCrossed className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">
        No results found
      </h2>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        We couldn't find any food items, restaurants, or locations matching{' '}
        <span className="font-semibold text-slate-900">"{query}"</span>.
      </p>

      <p className="text-xs text-slate-500 mb-6">
        Try another food or restaurant name, check for spelling mistakes, or clear your applied filters.
      </p>

      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
        >
          Reset applied filters
        </button>
      )}
    </div>
  );
};
