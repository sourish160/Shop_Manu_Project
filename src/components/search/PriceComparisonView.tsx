import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Utensils, CheckCircle2 } from 'lucide-react';
import { FoodSearchResult } from '../../services/searchService';
import { formatCurrency } from '../../utils/formatters';
import { formatDistance } from '../../utils/geolocation';

interface PriceComparisonViewProps {
  foods: FoodSearchResult[];
  onSuggestedQuery?: (term: string) => void;
  className?: string;
}

interface ComparableDishGroup {
  normalizedName: string;
  displayName: string;
  vegType: 'veg' | 'non_veg';
  categoryName?: string;
  items: FoodSearchResult[];
  // Mapping of variant name -> array of { restaurantName, restaurantSlug, area, price, available, distance_km }
  variantComparisons: Map<
    string,
    Array<{
      restaurantId: string;
      restaurantName: string;
      restaurantSlug: string;
      area: string;
      city: string;
      price: number;
      available: boolean;
      distanceKm?: number | null;
    }>
  >;
}

export const PriceComparisonView: React.FC<PriceComparisonViewProps> = ({
  foods,
  onSuggestedQuery,
  className = '',
}) => {
  // 1. Group foods by canonical name (lowercase, trimmed)
  const groupsMap = new Map<string, ComparableDishGroup>();

  foods.forEach((food) => {
    const key = food.name.toLowerCase().trim();

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        normalizedName: key,
        displayName: food.name,
        vegType: food.veg_type,
        categoryName: food.category?.name,
        items: [],
        variantComparisons: new Map(),
      });
    }

    const group = groupsMap.get(key)!;
    group.items.push(food);

    // Group variants across shops
    (food.variants || []).forEach((variant) => {
      const vKey = variant.name.toLowerCase().trim();
      const existingList = group.variantComparisons.get(vKey) || [];

      // Avoid duplicate restaurants in the same variant
      if (!existingList.some((e) => e.restaurantId === food.restaurant.id)) {
        existingList.push({
          restaurantId: food.restaurant.id,
          restaurantName: food.restaurant.name,
          restaurantSlug: food.restaurant.slug,
          area: food.restaurant.area,
          city: food.restaurant.city,
          price: variant.price,
          available: variant.available,
          distanceKm: food.distance_km,
        });
        existingList.sort((a, b) => a.price - b.price);
        group.variantComparisons.set(vKey, existingList);
      }
    });
  });

  // Filter groups that have offerings from at least 2 distinct shops
  const multiShopGroups: ComparableDishGroup[] = [];
  groupsMap.forEach((group) => {
    const distinctRestaurants = new Set(group.items.map((i) => i.restaurant.id));
    if (distinctRestaurants.size >= 2) {
      multiShopGroups.push(group);
    }
  });

  if (multiShopGroups.length === 0) {
    return (
      <div className={`editorial-card p-8 sm:p-12 text-center my-6 max-w-3xl mx-auto rounded-xl border border-cream-200/12 bg-[#120E0C] shadow-xl ${className}`}>
        <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/25 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-4">
          <Utensils className="w-5 h-5 stroke-[1.5]" />
        </div>
        <h3 className="font-serif text-2xl font-normal text-cream-100 mb-2">
          Single-Shop Offerings in Current Search
        </h3>
        <p className="text-xs sm:text-sm text-cream-200/70 mb-6 leading-relaxed max-w-lg mx-auto font-sans">
          The current search results do not contain identical dishes offered across multiple shops. To compare prices on identical items with verified portion rates, try searching for dishes like:
        </p>

        {onSuggestedQuery && (
          <div className="flex flex-wrap justify-center gap-2">
            {['Chicken Biryani', 'Mutton Biryani', 'Paneer Kathi Roll', 'Special Mutton Kebab'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestedQuery(term)}
                className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-cream-200/90 bg-cream-100/[0.06] hover:bg-amber-400 hover:text-[#0A0807] border border-cream-200/15 rounded-lg transition-all font-medium"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Informative Guidance Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.04] text-xs font-sans text-cream-200/80 leading-relaxed flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cream-100 font-serif text-sm block mb-0.5">
            Verified Portion Price Comparison
          </span>
          Prices are extracted directly from active digital menus maintained by verified shops. Only identical portion sizes (e.g., Full vs. Full, Regular vs. Regular) are compared directly.
        </div>
      </div>

      {multiShopGroups.map((group) => {
        const isVeg = group.vegType === 'veg';
        const distinctShopCount = new Set(group.items.map((i) => i.restaurant.id)).size;

        return (
          <section
            key={group.normalizedName}
            className="editorial-card rounded-2xl border border-cream-200/12 bg-[#120E0C] overflow-hidden shadow-2xl transition-all hover:border-cream-200/20"
          >
            {/* Header: Dish Name & Meta */}
            <div className="p-5 sm:p-6 border-b border-cream-200/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#16110E]">
              <div>
                <div className="flex items-center space-x-2.5 mb-2">
                  {/* Indian Veg / Non-Veg symbol */}
                  <div
                    className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center p-0.5 ${
                      isVeg ? 'border-emerald-500/70' : 'border-amber-500/70'
                    }`}
                    title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                  <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isVeg ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                  {group.categoryName && (
                    <>
                      <span className="text-cream-200/30 text-xs">·</span>
                      <span className="text-xs text-cream-200/60 font-sans">{group.categoryName}</span>
                    </>
                  )}
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-cream-100 tracking-tight">
                  {group.displayName}
                </h3>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-lg">
                  Available at {distinctShopCount} verified shops
                </span>
              </div>
            </div>

            {/* Direct Portion-to-Portion Comparison Table (when comparable portions exist) */}
            <div className="p-5 sm:p-6 space-y-6">
              {Array.from(group.variantComparisons.entries()).map(([variantName, shops]) => {
                if (shops.length < 2) return null;

                const lowestPrice = Math.min(...shops.map((s) => s.price));
                const highestPrice = Math.max(...shops.map((s) => s.price));
                const hasPriceSpread = highestPrice > lowestPrice;

                return (
                  <div key={variantName} className="rounded-xl border border-cream-200/10 bg-[#0E0B09] p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3.5 pb-2 border-b border-cream-200/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs uppercase font-mono tracking-wider text-amber-300 font-semibold">
                          Portion: {variantName}
                        </span>
                        <span className="text-[10px] text-cream-200/40 font-mono">
                          ({shops.length} shops offering this exact portion)
                        </span>
                      </div>

                      {hasPriceSpread ? (
                        <span className="text-[11px] font-mono text-cream-200/70">
                          Price range: <strong className="text-amber-300 font-medium">{formatCurrency(lowestPrice)}</strong> to <strong className="text-cream-100 font-medium">{formatCurrency(highestPrice)}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400">
                          Consistent rate: {formatCurrency(lowestPrice)}
                        </span>
                      )}
                    </div>

                    {/* Side-by-side shop breakdown for this exact portion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {shops.map((shop) => {
                        const isLowest = shop.price === lowestPrice && hasPriceSpread;

                        return (
                          <div
                            key={shop.restaurantId}
                            className={`p-3.5 rounded-lg border flex flex-col justify-between font-sans transition-all ${
                              isLowest
                                ? 'bg-amber-400/[0.08] border-amber-400/40 shadow-sm'
                                : 'bg-[#14100D] border-cream-200/10'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <Link
                                  to={`/restaurant/${shop.restaurantSlug}`}
                                  className="text-xs font-semibold text-cream-100 hover:text-amber-300 transition-colors truncate font-sans"
                                >
                                  {shop.restaurantName}
                                </Link>
                                {isLowest && (
                                  <span className="text-[9px] font-mono uppercase tracking-wider font-semibold bg-amber-400 text-[#0A0807] px-1.5 py-0.2 rounded shrink-0 ml-1">
                                    Lowest rate
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-cream-200/50 flex items-center space-x-1 mb-2">
                                <MapPin className="w-3 h-3 text-amber-400/70 shrink-0" />
                                <span className="truncate">{shop.area}, {shop.city}</span>
                              </p>
                            </div>

                            <div className="pt-2 border-t border-cream-200/10 flex items-baseline justify-between mt-1">
                              <span className="font-serif text-lg font-normal text-amber-300">
                                {formatCurrency(shop.price)}
                              </span>

                              <Link
                                to={`/restaurant/${shop.restaurantSlug}`}
                                className="text-[11px] font-mono uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                              >
                                <span>Menu</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Complete Participating Shops Details */}
              <div className="pt-4 border-t border-cream-200/10">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-cream-200/50 mb-3">
                  All Kitchens Serving {group.displayName}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-cream-200/10 bg-[#0E0B09] flex flex-col justify-between font-sans"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Link
                            to={`/restaurant/${item.restaurant.slug}`}
                            className="font-serif text-base font-normal text-cream-100 hover:text-amber-300 transition-colors"
                          >
                            {item.restaurant.name}
                          </Link>
                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              item.available
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                : 'bg-cream-100/5 text-cream-200/40 border-cream-200/10'
                            }`}
                          >
                            {item.available ? 'In Stock' : 'Sold Out'}
                          </span>
                        </div>

                        <p className="text-xs text-cream-200/50 flex items-center space-x-1 mb-3">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{[item.restaurant.area, item.restaurant.city].filter(Boolean).join(', ')}</span>
                          {item.distance_km !== null && item.distance_km !== undefined && (
                            <span className="ml-1 text-amber-300 font-mono">({formatDistance(item.distance_km)})</span>
                          )}
                        </p>

                        {/* Portion list */}
                        <div className="space-y-1 mb-4">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/40 block">
                            Available Portions:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(item.variants || []).map((v) => (
                              <span
                                key={v.id}
                                className="text-[11px] font-sans px-2 py-0.5 rounded bg-cream-100/[0.05] border border-cream-200/10 text-cream-200"
                              >
                                {v.name}: <strong className="text-amber-300 font-medium">₹{v.price}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-cream-200/10 flex items-center justify-between text-xs font-sans">
                        <span className="font-serif text-sm text-amber-300 font-normal">
                          {item.displayPriceText}
                        </span>

                        <Link
                          to={`/restaurant/${item.restaurant.slug}`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-400 hover:text-amber-300 uppercase tracking-wider font-sans"
                        >
                          <span>Open Menu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
