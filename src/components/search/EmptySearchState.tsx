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
      <div className="editorial-card p-8 sm:p-14 text-center my-8 max-w-2xl mx-auto rounded-2xl border border-cream-200/12 bg-[#120E0C] shadow-2xl">
        <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/25 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-5">
          <Search className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 mb-3 tracking-tight">
          Explore Menus & Local Flavors
        </h2>
        <p className="text-xs sm:text-sm text-cream-200/70 mb-8 leading-relaxed max-w-md mx-auto font-sans">
          Search a dish like <span className="font-serif italic text-amber-300">Chicken Biryani</span>, find artisanal kathi rolls, or browse participating food shops near your neighborhood.
        </p>

        {onSuggestedQuery && (
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {['Biryani', 'Kebab', 'Rolls', 'Salt Lake', 'Park Street', 'New Town'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestedQuery(term)}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-cream-200/80 bg-cream-100/[0.06] hover:bg-amber-400 hover:text-espresso-950 border border-cream-200/15 rounded-lg transition-all"
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
      <div className="editorial-card p-8 sm:p-14 text-center my-8 max-w-2xl mx-auto rounded-2xl border border-cream-200/12 bg-[#120E0C] shadow-2xl">
        <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/25 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-5">
          <MapPin className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 mb-3 tracking-tight">
          No Shops Found in this Area
        </h2>
        <p className="text-xs sm:text-sm text-cream-200/70 mb-2 leading-relaxed font-sans">
          We couldn't locate any {query ? `"${query}" dishes` : 'food shops'}{' '}
          within <span className="font-medium text-amber-300">{radiusKm || 5} km</span> of{' '}
          <span className="font-medium text-cream-100">{locationName || 'your location'}</span>.
        </p>

        <p className="text-xs text-cream-200/50 mb-8 font-sans">
          Try expanding your search radius or clearing dietary filters.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onIncreaseRadius && (
            <button
              type="button"
              onClick={onIncreaseRadius}
              className="inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-espresso-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-semibold rounded-lg transition-colors"
            >
              Expand radius to 10 km
            </button>
          )}

          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-cream-100 bg-cream-100/[0.08] hover:bg-cream-100/[0.14] border border-cream-200/20 rounded-lg transition-colors"
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
    <div className="editorial-card p-8 sm:p-14 text-center my-8 max-w-2xl mx-auto rounded-2xl border border-cream-200/12 bg-[#120E0C] shadow-2xl">
      <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/25 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-5">
        <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h2 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 mb-3 tracking-tight">
        No Items Match Your Search
      </h2>
      <p className="text-xs sm:text-sm text-cream-200/70 mb-2 leading-relaxed font-sans">
        We couldn't find any food items or restaurants matching{' '}
        <span className="font-serif italic text-amber-300">"{query}"</span>.
      </p>

      <p className="text-xs text-cream-200/50 mb-8 font-sans">
        Check for typos or try searching for a broader term like "Rolls", "Biryani", or "Kebab".
      </p>

      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-cream-100 bg-cream-100/[0.08] hover:bg-cream-100/[0.14] border border-cream-200/20 rounded-lg transition-colors"
        >
          Reset applied filters
        </button>
      )}
    </div>
  );
};
