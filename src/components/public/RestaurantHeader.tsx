import React from 'react';
import { Restaurant, RestaurantHours } from '../../lib/insforge';
import { getRestaurantOpeningStatus } from '../../utils/operatingHours';
import { CheckCircle2, Phone, Navigation, AlertTriangle } from 'lucide-react';
import { resolveShopImage, STOREFRONT_IMAGES } from '../cinematic/shopAssets';

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
  const shopCover = resolveShopImage(restaurant);

  return (
    <header className="bg-[#120E0C] border-b border-cream-200/10 text-cream-100">
      {/* Cover Banner */}
      <div className="w-full h-48 sm:h-64 md:h-80 bg-[#0A0807] relative overflow-hidden">
        <img
          src={shopCover.url}
          alt={`${restaurant.name} storefront`}
          className="w-full h-full object-cover filter brightness-[0.82] contrast-[1.08] saturate-[1.05]"
          loading="eager"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = STOREFRONT_IMAGES[0];
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120E0C] via-[#0A0807]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0807]/50 via-transparent to-transparent pointer-events-none" />

        {shopCover.isFallback && (
          <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded bg-[#0A0807]/75 backdrop-blur-md border border-cream-200/15 text-[10px] font-mono uppercase tracking-widest text-amber-300/80">
            Atmosphere Preview
          </div>
        )}
      </div>

      {/* Main Header Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 sm:-mt-24 mb-4 relative z-10">
          {/* Logo */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#1A1410] p-1.5 border border-cream-200/15 rounded-2xl shadow-2xl shrink-0 overflow-hidden relative">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={`${restaurant.name} logo`}
                className="w-full h-full object-cover rounded-xl"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`logo-fallback w-full h-full bg-[#14100D] text-amber-300 font-serif flex items-center justify-center font-normal text-3xl sm:text-4xl border border-cream-200/10 rounded-xl ${
                restaurant.logo_url ? 'hidden' : 'flex'
              }`}
            >
              {restaurant.name.charAt(0)}
            </div>
          </div>

          {/* Title & Primary Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-cream-100 tracking-tight">
                {restaurant.name}
              </h1>
              {restaurant.verified && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/25 rounded">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  <span>Verified Menu</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-cream-200/60 font-sans">
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
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 text-xs font-sans uppercase tracking-wider font-semibold text-espresso-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-lg shadow-md transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Shop</span>
              </a>
            )}

            {onScrollToLocation && (
              <button
                type="button"
                onClick={onScrollToLocation}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-cream-200/20 bg-cream-100/[0.06] hover:bg-cream-100/[0.12] text-cream-100 text-xs font-sans uppercase tracking-wider rounded-lg transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>Directions</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center justify-center space-x-1 px-3 py-2.5 text-cream-200/40 hover:text-amber-300 text-xs font-mono uppercase tracking-wider transition-colors"
              title="Report incorrect information"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Status & Timing Bar */}
        <div className="mt-6 pt-4 border-t border-cream-200/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-cream-200/40 uppercase tracking-wider text-[10px]">Status:</span>
            {openingStatus.isOpen === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Open now {openingStatus.closingText ? `(${openingStatus.closingText})` : ''}
              </span>
            ) : openingStatus.isOpen === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs bg-cream-100/5 text-cream-200/50 border border-cream-200/15 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cream-200/40"></span>
                Closed {openingStatus.nextOpeningText ? `• ${openingStatus.nextOpeningText}` : ''}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-cream-200/40 bg-cream-100/5 border border-cream-200/10 rounded text-xs">
                Hours not configured
              </span>
            )}
          </div>

          {restaurant.phone && (
            <div className="text-cream-200/60 font-mono text-xs">
              Direct line: <span className="font-semibold text-amber-300">{restaurant.phone}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
