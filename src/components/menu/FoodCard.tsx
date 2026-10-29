import React from 'react';
import { Food, FoodVariant } from '../../lib/insforge';
import { DietaryBadge } from './DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { getFreshnessBadge, formatFreshnessDate } from '../../utils/freshness';
import { Clock, Edit3, Copy, Trash2, CheckCircle2, History, Tag } from 'lucide-react';

interface FoodCardProps {
  food: Food;
  isSelected: boolean;
  onSelect: (foodId: string) => void;
  onEdit: (food: Food) => void;
  onDuplicate: (food: Food) => void;
  onDelete: (food: Food) => void;
  onToggleAvailability: (food: Food) => void;
  onConfirmFresh: (food: Food) => void;
  onViewPriceHistory: (variant: FoodVariant, foodName: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleAvailability,
  onConfirmFresh,
  onViewPriceHistory,
}) => {
  const freshness = getFreshnessBadge(food.updated_at);

  return (
    <div
      className={`border rounded-md bg-white p-4 transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-slate-900 ring-1 ring-slate-900 shadow-md bg-slate-50/20'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(food.id)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4 cursor-pointer"
              title="Select dish for bulk actions"
            />
            <DietaryBadge type={food.veg_type} showText={true} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Freshness Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${freshness.className}`}
              title={`Last updated: ${formatFreshnessDate(food.updated_at)}`}
            >
              {freshness.label}
            </span>
          </div>
        </div>

        {/* Food Body: Image & Info */}
        <div className="flex items-start gap-3">
          {/* Food Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 relative">
            {food.image_url ? (
              <img
                src={food.image_url}
                alt={food.name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.no-photo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'block';
                }}
              />
            ) : null}
            <div className={`no-photo-fallback text-center p-1 text-slate-400 ${food.image_url ? 'hidden' : 'block'}`}>
              <Tag className="w-5 h-5 mx-auto mb-0.5 stroke-1" />
              <span className="text-[9px] font-medium block">No Photo</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate" title={food.name}>
                {food.name}
              </h4>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Updated {formatFreshnessDate(food.updated_at)}</span>
              {food.prep_time_minutes && (
                <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{food.prep_time_minutes} min</span>
                </span>
              )}
            </div>

            {food.description && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                {food.description}
              </p>
            )}

            {/* Promotional or Base Price indicator */}
            {food.discount_price && food.base_price && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 line-through">
                  {formatCurrency(food.base_price)}
                </span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(food.discount_price)} Offer
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Variants & Pricing List */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
          {food.variants && food.variants.length > 0 ? (
            food.variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded hover:bg-slate-50"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      v.available ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-slate-700 font-medium">{v.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{formatCurrency(v.price)}</span>
                  <button
                    type="button"
                    onClick={() => onViewPriceHistory(v, food.name)}
                    className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-700 underline font-medium"
                    title="Inspect price modification timeline"
                  >
                    <History className="w-2.5 h-2.5" />
                    <span>History</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No variants configured</span>
          )}
        </div>

        {/* Attached Add-ons Chips */}
        {food.addons && food.addons.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1 items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Add-ons:</span>
            {food.addons.map((ad) => (
              <span
                key={ad.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
              >
                <span>+{ad.name}</span>
                <span className="text-slate-400">({formatCurrency(ad.price)})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Status & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        {/* Availability Toggle Status Button */}
        <button
          type="button"
          onClick={() => onToggleAvailability(food)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-colors border ${
            food.available
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
          title="Click to toggle availability"
        >
          <span
            className={`w-2 h-2 rounded-full ${food.available ? 'bg-emerald-600' : 'bg-slate-400'}`}
          />
          <span>{food.available ? 'Available' : 'Unavailable'}</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onConfirmFresh(food)}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-transparent hover:border-emerald-200 transition-colors"
            title="Confirm dish details are fresh today"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(food)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
            title="Duplicate dish"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(food)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
            title="Edit dish"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(food)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors"
            title="Remove dish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
