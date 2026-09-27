import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Store, CheckCircle2, Navigation } from 'lucide-react';
import { RestaurantSearchResult } from '../../services/searchService';
import { formatDistance } from '../../utils/geolocation';

interface RestaurantResultCardProps {
  restaurant: RestaurantSearchResult;
}

export const RestaurantResultCard: React.FC<RestaurantResultCardProps> = ({ restaurant }) => {
  const { openingStatus } = restaurant;

  const isOpen = openingStatus.isOpen === true;
  const isClosed = openingStatus.isOpen === false;

  return (
    <article className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all flex flex-col justify-between">
      <div>
        {/* Cover / Logo Banner */}
        <div className="flex items-center space-x-3 mb-3">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {restaurant.name}
              </h3>
              {restaurant.verified && (
                <span title="Verified Restaurant">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center text-xs text-slate-500 space-x-1 mt-0.5 justify-between">
              <div className="flex items-center space-x-1 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">
                  {restaurant.area}, {restaurant.city}
                </span>
              </div>
              {restaurant.distance_km !== null && restaurant.distance_km !== undefined && (
                <span className="inline-flex items-center space-x-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] flex-shrink-0">
                  <Navigation className="w-3 h-3 text-slate-500" />
                  <span>{formatDistance(restaurant.distance_km)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description snippet */}
        {restaurant.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {restaurant.description}
          </p>
        )}

        {/* Real Operating Hours Status */}
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              isOpen
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isClosed
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 text-slate-400" />
            {openingStatus.statusText}
          </span>

          {openingStatus.closingText && isOpen && (
            <span className="text-[11px] text-slate-500 truncate">
              {openingStatus.closingText}
            </span>
          )}

          {openingStatus.nextOpeningText && isClosed && (
            <span className="text-[11px] text-slate-500 truncate">
              {openingStatus.nextOpeningText}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 truncate max-w-[180px]">
          {restaurant.address}
        </span>

        <Link
          to={`/restaurant/${restaurant.slug}`}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
        >
          <span>View Menu</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  );
};
