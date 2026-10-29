import React from 'react';
import { Food } from '../../lib/insforge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DietaryBadge } from '../menu/DietaryBadge';
import { Clock } from 'lucide-react';
import { resolveMenuItemImage, MENU_IMAGE_MAP } from '../cinematic/menuAssets';

interface FoodItemCardProps {
  food: Food;
  onReportDish?: (food: Food) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ food, onReportDish }) => {
  const variants = food.variants || [];

  // Determine latest update timestamp between food and its variants
  const timestamps = [new Date(food.updated_at).getTime()];
  variants.forEach((v) => timestamps.push(new Date(v.updated_at).getTime()));
  const latestTimestamp = new Date(Math.max(...timestamps)).toISOString();

  return (
    <article
      className={`editorial-card bg-[#120E0C] border border-cream-200/10 p-5 hover:border-amber-400/40 transition-all flex flex-col sm:flex-row justify-between gap-4 group rounded-sm ${
        food.available ? '' : 'opacity-70'
      }`}
    >
      {/* Left Column: Details */}
      <div className="flex-1 min-w-0">
        {/* Badges Bar */}
        <div className="flex items-center space-x-2 mb-2.5 flex-wrap gap-y-1">
          {/* Dietary Badge */}
          <DietaryBadge type={food.veg_type || 'veg'} showText={true} size="sm" />

          <span className="text-cream-200/20">•</span>

          {/* Availability Badge */}
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
              food.available
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-cream-200/5 text-cream-300/40 border-cream-200/10'
            }`}
          >
            {food.available ? 'In Stock' : 'Sold Out'}
          </span>

          {food.prep_time_minutes && (
            <>
              <span className="text-cream-200/20">•</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cream-300/60">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{food.prep_time_minutes}m prep</span>
              </span>
            </>
          )}
        </div>

        {/* Food Name */}
        <h3 className="font-serif text-lg font-medium text-cream-100 group-hover:text-amber-300 transition-colors leading-snug">
          {food.name}
        </h3>

        {/* Optional Description */}
        {food.description && (
          <p className="mt-1 text-xs text-cream-300/70 font-normal leading-relaxed line-clamp-2">
            {food.description}
          </p>
        )}

        {/* Pricing & Variants List */}
        <div className="mt-3">
          {variants.length === 0 ? (
            <span className="text-xs font-mono text-cream-300/40 italic">Price not listed</span>
          ) : variants.length === 1 ? (
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-medium text-amber-300">
                {formatCurrency(variants[0].price)}
              </span>
              {variants[0].name.toLowerCase() !== 'regular' && (
                <span className="text-xs font-mono text-cream-300/50">({variants[0].name})</span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="px-2.5 py-1 bg-[#181310] border border-cream-200/10 text-xs font-mono flex items-center gap-1.5 rounded-xs"
                >
                  <span className="text-cream-300/60">{v.name}:</span>
                  <span className="font-medium text-amber-300">{formatCurrency(v.price)}</span>
                  {!v.available && (
                    <span className="text-[10px] text-amber-400/70 font-semibold">(Sold out)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attached Add-ons */}
        {food.addons && food.addons.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-cream-200/10 flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] uppercase tracking-wider text-cream-300/50">Add-ons:</span>
            {food.addons.map((ad) => (
              <span
                key={ad.id}
                className="text-[10px] px-2 py-0.5 bg-[#181310] text-cream-200/80 border border-cream-200/10 rounded-xs"
              >
                +{ad.name} ({formatCurrency(ad.price)})
              </span>
            ))}
          </div>
        )}

        {/* Freshness / Last Updated Info */}
        <div className="mt-4 pt-3 border-t border-cream-200/10 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cream-300/50">
          <span>Updated: {formatDate(latestTimestamp)}</span>
          {onReportDish && (
            <button
              type="button"
              onClick={() => onReportDish(food)}
              className="text-cream-300/50 hover:text-amber-300 transition-colors"
            >
              Report price issue
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Dish Photo */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#181310] border border-cream-200/10 overflow-hidden shrink-0 self-start sm:self-center rounded-sm relative">
        <img
          src={resolveMenuItemImage(food)}
          alt={food.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 filter brightness-[0.92] contrast-[1.05]"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = MENU_IMAGE_MAP.default;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/30 via-transparent to-transparent pointer-events-none" />
      </div>
    </article>
  );
};
