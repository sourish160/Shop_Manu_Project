import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Navigation } from 'lucide-react';
import { FoodSearchResult } from '../../services/searchService';
import { formatRelativeTime } from '../../utils/formatters';
import { formatDistance } from '../../utils/geolocation';
import { resolveMenuItemImage, MENU_IMAGE_MAP } from '../cinematic/menuAssets';

interface FoodResultCardProps {
  item: FoodSearchResult;
  highlightQuery?: string;
}

export const FoodResultCard: React.FC<FoodResultCardProps> = ({ item }) => {
  const isVeg = item.veg_type === 'veg';
  const updatedRelative = formatRelativeTime(item.updated_at);

  return (
    <article className="editorial-card p-6 rounded-xl flex flex-col justify-between group border border-cream-200/12 bg-[#120E0C] hover:border-amber-400/40 transition-all shadow-xl">
      <div>
        {/* Top bar: Veg/Non-Veg symbol & Availability badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2 font-sans">
            {/* Standard Indian Veg/Non-Veg symbol */}
            <div
              className={`w-3.5 h-3.5 border rounded-xs flex items-center justify-center p-0.5 ${
                isVeg ? 'border-emerald-500/70' : 'border-amber-500/70'
              }`}
              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isVeg ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <span
              className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                isVeg ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            {item.category?.name && (
              <span className="text-xs text-cream-200/40 font-sans">
                · {item.category.name}
              </span>
            )}
          </div>

          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
              item.available
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : 'bg-cream-100/5 text-cream-200/40 border-cream-200/10'
            }`}
          >
            {item.available ? 'Available' : 'Sold Out'}
          </span>
        </div>

        {/* Food Name, Description & Image */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-serif font-normal text-cream-100 group-hover:text-amber-300 transition-colors leading-snug">
              {item.name}
            </h3>

            {item.description && (
              <p className="text-xs text-cream-200/60 font-sans mt-1.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Price section */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-serif font-normal text-amber-300">
                {item.displayPriceText}
              </span>
              {item.matchingVariant && item.matchingVariant.name.toLowerCase() !== 'regular' && (
                <span className="text-xs text-cream-200/50 font-sans">
                  ({item.matchingVariant.name})
                </span>
              )}
            </div>

            {/* Variants pill list if multiple portions exist */}
            {item.variants && item.variants.length > 1 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {item.variants.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center text-[10px] bg-cream-100/[0.06] border border-cream-200/12 rounded px-2 py-0.5 text-cream-200 font-sans"
                  >
                    <span className="text-cream-200/50 mr-1">{v.name}:</span>
                    <strong className="font-semibold text-amber-300">₹{v.price}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-20 h-20 rounded-lg overflow-hidden border border-cream-200/15 flex-shrink-0 relative bg-[#181310]">
            <img
              src={resolveMenuItemImage(item)}
              alt={item.name}
              className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05]"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = MENU_IMAGE_MAP.default;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/30 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Restaurant & Location Info */}
        <div className="mt-4 pt-3.5 border-t border-cream-200/10 flex flex-col space-y-1 font-sans">
          <Link
            to={`/restaurant/${item.restaurant.slug}`}
            className="text-xs font-semibold text-cream-100 hover:text-amber-300 transition-colors truncate"
          >
            {item.restaurant.name}
          </Link>
          <div className="flex items-center justify-between text-xs text-cream-200/50">
            <div className="flex items-center space-x-1 truncate text-[11px]">
              <MapPin className="w-3 h-3 flex-shrink-0 text-amber-400" />
              <span className="truncate">
                {[item.restaurant.area, item.restaurant.city].filter(Boolean).join(', ')}
              </span>
            </div>

            {item.distance_km !== null && item.distance_km !== undefined && (
              <span className="inline-flex items-center space-x-1 font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] rounded flex-shrink-0">
                <Navigation className="w-2.5 h-2.5 text-amber-400" />
                <span>{formatDistance(item.distance_km)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Freshness, Compare Shops and View Menu Link */}
      <div className="mt-4 pt-3 border-t border-cream-200/10 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-cream-200/40">
            Updated {updatedRelative}
          </span>
          <span className="text-cream-200/20 text-[10px]">·</span>
          <Link
            to={`/search?q=${encodeURIComponent(item.name)}&view=comparison`}
            className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 hover:text-amber-300 transition-colors"
            title="Compare portion prices for this dish across participating shops"
          >
            Compare Shops
          </Link>
        </div>

        <Link
          to={`/restaurant/${item.restaurant.slug}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
        >
          <span>View Menu</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};
