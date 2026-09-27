import React from 'react';
import { Restaurant, RestaurantHours } from '../../lib/insforge';
import { getRestaurantOpeningStatus } from '../../utils/operatingHours';

interface RestaurantHeaderProps {
  restaurant: Restaurant;
  hours: RestaurantHours[];
  onScrollToLocation?: () => void;
  onOpenReport: () => void;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurant,
  hours,
  onScrollToLocation,
  onOpenReport,
}) => {
  const openingStatus = getRestaurantOpeningStatus(hours);

  return (
    <header className="bg-white border-b border-slate-200">
      {/* Cover Banner */}
      <div className="w-full h-44 sm:h-56 md:h-72 bg-slate-100 relative overflow-hidden">
        {restaurant.cover_url ? (
          <img
            src={restaurant.cover_url}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">No cover image uploaded</span>
          </div>
        )}
      </div>

      {/* Main Header Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-16 sm:-mt-20 mb-4 relative z-10">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md bg-white p-1 border border-slate-200 shadow-sm shrink-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover rounded"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-700 font-bold text-2xl uppercase rounded">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title & Primary Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {restaurant.name}
              </h1>
              {restaurant.verified && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Verified
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600">
              {restaurant.address}
              {restaurant.area ? `, ${restaurant.area}` : ''}
              {restaurant.city ? `, ${restaurant.city}` : ''}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Call Restaurant
              </a>
            )}

            {onScrollToLocation && (
              <button
                type="button"
                onClick={onScrollToLocation}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Directions
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center justify-center px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
              title="Report incorrect information"
            >
              Report Info
            </button>
          </div>
        </div>

        {/* Status & Timing Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Operating Status:</span>
            {openingStatus.isOpen === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Open now {openingStatus.closingText ? `(${openingStatus.closingText})` : ''}
              </span>
            ) : openingStatus.isOpen === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                Closed {openingStatus.nextOpeningText ? `• ${openingStatus.nextOpeningText}` : ''}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-slate-500 bg-slate-100 font-medium">
                Hours not available
              </span>
            )}
          </div>

          {restaurant.phone && (
            <div className="text-slate-500">
              Direct Phone:{' '}
              <a href={`tel:${restaurant.phone}`} className="font-mono text-slate-800 hover:underline">
                {restaurant.phone}
              </a>
            </div>
          )}
        </div>

        {/* Optional Description */}
        {restaurant.description && (
          <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {restaurant.description}
          </div>
        )}
      </div>
    </header>
  );
};
