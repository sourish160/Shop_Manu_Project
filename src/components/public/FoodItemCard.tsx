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
      className={`border rounded-md p-4 transition-all bg-white flex flex-col sm:flex-row justify-between gap-4 ${
        food.available ? 'border-slate-200 shadow-sm' : 'border-slate-200 bg-slate-50/70 opacity-90'
      }`}
    >
      {/* Left Column: Details */}
      <div className="flex-1 min-w-0">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Veg / Non-Veg Text Badge */}
          {food.veg_type === 'veg' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300">
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-red-800 bg-red-50 border border-red-300">
              Non-Veg
            </span>
          )}

          {/* Availability Text Badge */}
          {food.available ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 bg-emerald-50">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300">
              Unavailable
            </span>
          )}
        </div>

        {/* Food Name */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          {food.name}
        </h3>

        {/* Optional Description */}
        {food.description && (
          <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-3">
            {food.description}
          </p>
        )}

        {/* Variants & Pricing List */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Options & Pricing
          </span>

          {variants.length === 0 ? (
            <span className="text-xs text-slate-400">Price not configured</span>
          ) : variants.length === 1 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-900">
                {formatCurrency(variants[0].price)}
              </span>
              {variants[0].name.toLowerCase() !== 'regular' && (
                <span className="text-xs text-slate-500">({variants[0].name})</span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs flex items-center gap-1.5"
                >
                  <span className="text-slate-600 font-medium">{v.name}:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(v.price)}</span>
                  {!v.available && (
                    <span className="text-[10px] text-amber-700 font-semibold">(Sold out)</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freshness / Last Updated Info */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Price updated: {formatDate(latestTimestamp)}</span>
          {onReportDish && (
            <button
              type="button"
              onClick={() => onReportDish(food)}
              className="text-slate-400 hover:text-slate-700 hover:underline transition-colors"
            >
              Report dish issue
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Dish Photo */}
      <div className="w-full sm:w-28 sm:h-28 h-36 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 self-start sm:self-center">
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 p-2 text-center">
            <svg
              className="w-7 h-7 mb-1 text-slate-300"
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
            <span className="text-[10px] text-slate-400 font-medium">No photo</span>
          </div>
        )}
      </div>
    </article>
  );
};
