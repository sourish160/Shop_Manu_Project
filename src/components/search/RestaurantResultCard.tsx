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
    <article className="forge-card rounded-2xl p-5 sm:p-6 transition-all duration-500 hover:border-[#C5A064]/50 flex flex-col justify-between group">
      <div>
        {/* Cover / Logo Banner */}
        <div className="flex items-center space-x-3.5 mb-3.5">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0 group-hover:border-[#C5A064]/50 transition-colors"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A064] flex-shrink-0 group-hover:border-[#C5A064]/50 transition-colors">
              <Store className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="font-editorial text-xl sm:text-2xl font-light text-[#F4F2ED] group-hover:text-white transition-colors truncate">
                {restaurant.name}
              </h3>
              {restaurant.verified && (
                <span title="Verified Restaurant">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A064] flex-shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center text-xs text-[#F4F2ED]/60 space-x-1 mt-0.5 justify-between">
              <div className="flex items-center space-x-1 font-mono text-[11px] truncate">
                <MapPin className="w-3 h-3 flex-shrink-0 text-[#C5A064]" />
                <span className="truncate">
                  {restaurant.area}, {restaurant.city}
                </span>
              </div>
              {restaurant.distance_km !== null && restaurant.distance_km !== undefined && (
                <span className="inline-flex items-center space-x-1 font-mono font-medium text-[#C5A064] bg-[#C5A064]/10 border border-[#C5A064]/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider flex-shrink-0">
                  <Navigation className="w-2.5 h-2.5 text-[#C5A064]" />
                  <span>{formatDistance(restaurant.distance_km)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description snippet */}
        {restaurant.description && (
          <p className="font-sans font-light text-xs text-[#F4F2ED]/70 line-clamp-2 leading-relaxed mb-3.5">
            {restaurant.description}
          </p>
        )}

        {/* Real Operating Hours Status */}
        <div className="flex items-center space-x-2 text-xs">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase border ${
              isOpen
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : isClosed
                ? 'bg-white/5 text-[#F4F2ED]/60 border-white/10'
                : 'bg-white/5 text-[#F4F2ED]/50 border-white/10'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 text-[#C5A064]" />
            {openingStatus.statusText}
          </span>

          {openingStatus.closingText && isOpen && (
            <span className="font-mono text-[10px] text-[#F4F2ED]/50 truncate">
              {openingStatus.closingText}
            </span>
          )}

          {openingStatus.nextOpeningText && isClosed && (
            <span className="font-mono text-[10px] text-[#F4F2ED]/50 truncate">
              {openingStatus.nextOpeningText}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#F4F2ED]/50 truncate max-w-[170px]">
          {restaurant.address}
        </span>

        <Link
          to={`/restaurant/${restaurant.slug}`}
          className="forge-btn py-1.5 px-3.5 text-[10px] rounded-lg tracking-widest"
        >
          <span>View Menu</span>
          <ArrowRight className="w-3 h-3 ml-1 text-[#C5A064]" />
        </Link>
      </div>
    </article>
  );
};
