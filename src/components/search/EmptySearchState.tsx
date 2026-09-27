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
      <div className="forge-card rounded-2xl p-8 sm:p-12 text-center my-8 max-w-xl mx-auto shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#C5A064] mb-5 shadow-inner">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="font-editorial text-3xl font-light text-[#F4F2ED] mb-2 tracking-tight">
          Query The Atelier Catalog
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-light mb-6 leading-relaxed">
          Search for authentic specimens like <span className="font-medium text-[#F4F2ED]">Chicken Biryani</span>, specific kitchen ateliers, or activate <span className="font-medium text-[#F4F2ED]">Near Me</span> telemetry.
        </p>

        {onSuggestedQuery && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Biryani', 'Kebab', 'Rolls', 'Salt Lake', 'Park Street'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestedQuery(term)}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-300 bg-white/5 hover:border-[#C5A064]/50 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
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
      <div className="forge-card rounded-2xl p-8 sm:p-12 text-center my-8 max-w-xl mx-auto shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#C5A064] mb-5 shadow-inner">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="font-editorial text-3xl font-light text-[#F4F2ED] mb-2 tracking-tight">
          Zero Nearby Ateliers
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-light mb-4 leading-relaxed">
          We couldn't locate any approved {query ? `"${query}" specimens` : 'kitchens'}{' '}
          within <span className="font-mono font-medium text-[#F4F2ED]">{radiusKm || 5} km</span> of{' '}
          <span className="font-mono font-medium text-[#F4F2ED]">{locationName || 'your coordinates'}</span>.
        </p>

        <p className="font-mono text-xs text-zinc-500 mb-6">
          Try expanding your telemetry radius or resetting dietary restrictions.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onIncreaseRadius && (
            <button
              type="button"
              onClick={onIncreaseRadius}
              className="forge-btn inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] rounded-lg transition-all shadow-sm"
            >
              Expand radius to 10 km
            </button>
          )}

          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
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
    <div className="forge-card rounded-2xl p-8 sm:p-12 text-center my-8 max-w-xl mx-auto shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#C5A064] mb-5 shadow-inner">
        <UtensilsCrossed className="w-6 h-6" />
      </div>
      <h2 className="font-editorial text-3xl font-light text-[#F4F2ED] mb-2 tracking-tight">
        No Matching Specimens
      </h2>
      <p className="text-xs sm:text-sm text-zinc-400 font-light mb-4 leading-relaxed">
        We couldn't find any dishes or kitchens matching{' '}
        <span className="font-mono text-[#F4F2ED] font-medium">"{query}"</span>.
      </p>

      <p className="font-mono text-xs text-zinc-500 mb-6">
        Try alternative culinary queries or clear active criteria.
      </p>

      {hasActiveFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="forge-btn inline-flex items-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] rounded-lg transition-all"
        >
          Reset applied filters
        </button>
      )}
    </div>
  );
};
