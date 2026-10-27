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
    <article className="editorial-card p-6 rounded-xl flex flex-col justify-between group border border-cream-200/12 bg-[#120E0C] hover:border-amber-400/40 transition-all shadow-xl">
      <div>
        {/* Header: Logo / Image & Title */}
        <div className="flex items-start space-x-4 mb-4">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-12 h-12 rounded-lg object-cover border border-cream-200/20 bg-espresso-950/60 flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-espresso-900/60 border border-cream-200/20 flex items-center justify-center text-cream-200/50 flex-shrink-0">
              <Store className="w-5 h-5 text-amber-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <Link
                to={`/restaurant/${restaurant.slug}`}
                className="text-base font-serif font-normal text-cream-100 group-hover:text-amber-300 transition-colors truncate"
              >
                {restaurant.name}
              </Link>
              {restaurant.verified && (
                <span title="Verified Business Profile" className="flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </span>
              )}
            </div>

            <div className="flex items-center text-xs text-cream-200/60 space-x-1.5 mt-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {[restaurant.area, restaurant.city].filter(Boolean).join(', ')}
              </span>
              {restaurant.distance_km !== null && restaurant.distance_km !== undefined && (
                <>
                  <span className="text-cream-200/30">·</span>
                  <span className="inline-flex items-center space-x-1 font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] rounded flex-shrink-0">
                    <Navigation className="w-2.5 h-2.5 text-amber-400" />
                    <span>{formatDistance(restaurant.distance_km)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description snippet */}
        {restaurant.description && (
          <p className="text-xs text-cream-200/65 line-clamp-2 leading-relaxed mb-4 font-sans">
            {restaurant.description}
          </p>
        )}

        {/* Real Operating Hours Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border ${
              isOpen
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : isClosed
                ? 'bg-cream-100/5 text-cream-200/50 border-cream-200/15'
                : 'bg-cream-100/5 text-cream-200/50 border-cream-200/10'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 text-current" />
            {openingStatus.statusText}
          </span>

          {openingStatus.closingText && isOpen && (
            <span className="text-[11px] text-cream-200/50 truncate">
              {openingStatus.closingText}
            </span>
          )}

          {openingStatus.nextOpeningText && isClosed && (
            <span className="text-[11px] text-cream-200/50 truncate">
              {openingStatus.nextOpeningText}
            </span>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-4 border-t border-cream-200/10 flex items-center justify-between gap-2">
        <span className="text-xs text-cream-200/40 truncate max-w-[170px] font-sans" title={restaurant.address}>
          {restaurant.address}
        </span>

        <Link
          to={`/restaurant/${restaurant.slug}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
        >
          <span>View Menu</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};
