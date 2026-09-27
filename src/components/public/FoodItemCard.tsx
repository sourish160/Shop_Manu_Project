import React from 'react';
import { Food } from '../../lib/insforge';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
      className={`forge-card rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-[#C5A064]/50 flex flex-col sm:flex-row justify-between gap-5 group ${
        food.available ? '' : 'opacity-70'
      }`}
    >
      {/* Left Column: Details */}
      <div className="flex-1 min-w-0">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {/* Veg / Non-Veg Text Badge */}
          {food.veg_type === 'veg' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest text-emerald-300 bg-emerald-500/20 border border-emerald-500/40">
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-500/40">
              Non-Veg
            </span>
          )}

          {/* Availability Text Badge */}
          {food.available ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#C5A064] bg-[#C5A064]/10 border border-[#C5A064]/30">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest text-zinc-500 bg-white/5 border border-white/10">
              Unavailable
            </span>
          )}
        </div>

        {/* Food Name */}
        <h3 className="font-editorial text-2xl font-light text-[#F4F2ED] group-hover:text-white transition-colors leading-tight">
          {food.name}
        </h3>

        {/* Optional Description */}
        {food.description && (
          <p className="mt-1.5 text-xs text-zinc-400 font-light leading-relaxed line-clamp-3">
            {food.description}
          </p>
        )}

        {/* Variants & Pricing List */}
        <div className="mt-4 pt-3.5 border-t border-white/10">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] block mb-2">
            Pricing & Variants
          </span>

          {variants.length === 0 ? (
            <span className="text-xs font-mono text-zinc-500">Price not configured</span>
          ) : variants.length === 1 ? (
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base sm:text-lg font-medium text-[#C5A064]">
                {formatCurrency(variants[0].price)}
              </span>
              {variants[0].name.toLowerCase() !== 'regular' && (
                <span className="text-xs font-mono text-zinc-500">({variants[0].name})</span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1.5"
                >
                  <span className="text-zinc-400">{v.name}:</span>
                  <span className="font-medium text-[#C5A064]">{formatCurrency(v.price)}</span>
                  {!v.available && (
                    <span className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold">(Sold out)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freshness / Last Updated Info */}
        <div className="mt-4 pt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>Price updated: {formatDate(latestTimestamp)}</span>
          {onReportDish && (
            <button
              type="button"
              onClick={() => onReportDish(food)}
              className="text-zinc-500 hover:text-[#C5A064] uppercase tracking-widest transition-colors"
            >
              Report dish issue
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Dish Photo */}
      <div className="w-full sm:w-28 sm:h-28 h-36 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 self-start sm:self-center group-hover:border-[#C5A064]/40 transition-colors">
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-white/5 p-2 text-center">
            <svg
              className="w-6 h-6 mb-1 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">No photo</span>
          </div>
        )}
      </div>
    </article>
  );
};
