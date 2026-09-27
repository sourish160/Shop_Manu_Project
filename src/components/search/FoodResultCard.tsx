import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Utensils, Navigation } from 'lucide-react';
import { FoodSearchResult } from '../../services/searchService';
import { formatRelativeTime } from '../../utils/formatters';
import { formatDistance } from '../../utils/geolocation';

interface FoodResultCardProps {
  item: FoodSearchResult;
  highlightQuery?: string;
}

export const FoodResultCard: React.FC<FoodResultCardProps> = ({ item }) => {
  const isVeg = item.veg_type === 'veg';
  const updatedRelative = formatRelativeTime(item.updated_at);

  return (
    <article className="forge-card rounded-2xl p-5 sm:p-6 transition-all duration-500 hover:border-[#C5A064]/50 flex flex-col justify-between group">
      <div>
        {/* Top bar: Veg indicator & Availability badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            {/* Standard Veg/Non-Veg symbol */}
            <div
              className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 rounded ${
                isVeg ? 'border-emerald-500' : 'border-amber-600'
              }`}
              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isVeg ? 'bg-emerald-400' : 'bg-amber-500'
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-mono uppercase tracking-widest ${
                isVeg ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            {item.category?.name && (
              <span className="text-[11px] font-mono text-zinc-500">
                • {item.category.name}
              </span>
            )}
          </div>

          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
              item.available
                ? 'bg-[#C5A064]/10 text-[#C5A064] border-[#C5A064]/30'
                : 'bg-white/5 text-zinc-500 border-white/10'
            }`}
          >
            {item.available ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Food Name & Image (if provided) */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-editorial text-xl sm:text-2xl font-light text-[#F4F2ED] group-hover:text-white transition-colors leading-snug">
              {item.name}
            </h3>

            {item.description && (
              <p className="text-xs text-zinc-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-white/10 group-hover:border-[#C5A064]/40 transition-colors flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-[#C5A064] flex-shrink-0 group-hover:border-[#C5A064]/40 transition-colors">
              <Utensils className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Restaurant & Location */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col space-y-1.5">
          <Link
            to={`/restaurant/${item.restaurant.slug}`}
            className="text-sm font-medium text-[#F4F2ED] hover:text-[#C5A064] transition-colors truncate"
          >
            {item.restaurant.name}
          </Link>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center space-x-1.5 truncate font-mono text-[11px]">
              <MapPin className="w-3 h-3 flex-shrink-0 text-[#C5A064]" />
              <span className="truncate">
                {item.restaurant.area}, {item.restaurant.city}
              </span>
            </div>
            {item.distance_km !== null && item.distance_km !== undefined && (
              <span className="inline-flex items-center space-x-1 font-mono text-[10px] uppercase tracking-wider text-[#C5A064] bg-[#C5A064]/10 border border-[#C5A064]/30 px-2 py-0.5 rounded flex-shrink-0">
                <Navigation className="w-2.5 h-2.5 text-[#C5A064]" />
                <span>{formatDistance(item.distance_km)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Price, Timestamp & Action */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
        <div>
          <div className="font-mono text-base sm:text-lg font-medium text-[#C5A064] tracking-tight">
            {item.displayPriceText}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 flex items-center space-x-1 mt-0.5">
            <Clock className="w-2.5 h-2.5 text-zinc-500" />
            <span>Updated {updatedRelative}</span>
          </div>
        </div>

        <Link
          to={`/restaurant/${item.restaurant.slug}`}
          className="forge-btn inline-flex items-center space-x-1.5 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] px-3 py-1.5 rounded-lg transition-all"
        >
          <span>View Menu</span>
          <ArrowRight className="w-3 h-3 text-[#C5A064]" />
        </Link>
      </div>
    </article>
  );
};
