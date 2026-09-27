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
    <header className="bg-[#0C0C0C]/90 border-b border-white/10 text-[#F4F2ED]">
      {/* Cover Banner */}
      <div className="w-full h-44 sm:h-56 md:h-72 bg-[#121212] relative overflow-hidden">
        {restaurant.cover_url ? (
          <>
            <img
              src={restaurant.cover_url}
              alt={`${restaurant.name} cover`}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-black/30" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#121212] text-zinc-600 font-mono">
            <span className="text-xs uppercase tracking-widest font-medium">Bespoke Atelier Kitchen</span>
          </div>
        )}
      </div>

      {/* Main Header Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-16 sm:-mt-20 mb-4 relative z-10">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#080808] p-1.5 border border-white/15 shadow-2xl shrink-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover rounded-xl"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-[#C5A064] font-editorial text-3xl rounded-xl">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title & Primary Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-light text-[#F4F2ED] tracking-tight">
                {restaurant.name}
              </h1>
              {restaurant.verified && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest bg-[#C5A064]/10 text-[#C5A064] border border-[#C5A064]/30">
                  Verified Atelier
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 font-light">
              {restaurant.address}
              {restaurant.area ? `, ${restaurant.area}` : ''}
              {restaurant.city ? `, ${restaurant.city}` : ''}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0">
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="forge-btn flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#F4F2ED] rounded-lg transition-all shadow-sm"
              >
                Call Kitchen
              </a>
            )}

            {onScrollToLocation && (
              <button
                type="button"
                onClick={onScrollToLocation}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 border border-white/15 bg-white/5 hover:border-[#C5A064]/50 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider transition-all"
              >
                Directions
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center justify-center px-3 py-2 text-zinc-500 hover:text-[#C5A064] text-xs font-mono uppercase tracking-widest transition-colors"
              title="Report incorrect information"
            >
              Report Info
            </button>
          </div>
        </div>

        {/* Status & Timing Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 uppercase text-[10px] tracking-widest">Operating Status:</span>
            {openingStatus.isOpen === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Open now {openingStatus.closingText ? `(${openingStatus.closingText})` : ''}
              </span>
            ) : openingStatus.isOpen === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Closed {openingStatus.nextOpeningText ? `• ${openingStatus.nextOpeningText}` : ''}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-zinc-500 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest">
                Hours not available
              </span>
            )}
          </div>

          {restaurant.phone && (
            <div className="text-zinc-400 text-xs">
              Direct Telemetry:{' '}
              <a href={`tel:${restaurant.phone}`} className="font-mono text-[#C5A064] hover:underline">
                {restaurant.phone}
              </a>
            </div>
          )}
        </div>

        {/* Optional Description */}
        {restaurant.description && (
          <div className="mt-3.5 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-3xl">
            {restaurant.description}
          </div>
        )}
      </div>
    </header>
  );
};
