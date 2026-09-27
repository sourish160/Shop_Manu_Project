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
    <article className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
      <div>
        {/* Top bar: Veg indicator & Availability badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-1.5">
            {/* Standard Veg/Non-Veg symbol */}
            <div
              className={`w-4 h-4 border flex items-center justify-center p-0.5 rounded ${
                isVeg ? 'border-emerald-600' : 'border-amber-800'
              }`}
              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isVeg ? 'bg-emerald-600' : 'bg-amber-800'
                }`}
              />
            </div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isVeg ? 'text-emerald-700' : 'text-amber-900'
              }`}
            >
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            {item.category?.name && (
              <span className="text-xs text-slate-400">
                • {item.category.name}
              </span>
            )}
          </div>

          <span
            className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              item.available
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {item.available ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Food Name & Image (if provided) */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {item.name}
            </h3>

            {item.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border border-slate-200 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-center text-slate-300 flex-shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Restaurant & Location */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col space-y-1">
          <Link
            to={`/restaurant/${item.restaurant.slug}`}
            className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors truncate"
          >
            {item.restaurant.name}
          </Link>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1 truncate">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">
                {item.restaurant.area}, {item.restaurant.city}
              </span>
            </div>
            {item.distance_km !== null && item.distance_km !== undefined && (
              <span className="inline-flex items-center space-x-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] flex-shrink-0">
                <Navigation className="w-3 h-3 text-slate-500" />
                <span>{formatDistance(item.distance_km)}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Price, Timestamp & Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-sm sm:text-base font-bold text-slate-900">
            {item.displayPriceText}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Price updated {updatedRelative}</span>
          </div>
        </div>

        <Link
          to={`/restaurant/${item.restaurant.slug}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-800 hover:text-slate-950 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <span>View Restaurant</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  );
};
