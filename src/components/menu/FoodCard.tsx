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
      className={`border rounded-2xl bg-[#1C1512] p-4 sm:p-5 transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-[#E9A052] ring-2 ring-[#E9A052]/20 shadow-md bg-[#241A15]'
          : 'border-[#382820] hover:border-[#E9A052]/40 hover:shadow-lg'
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#382820]">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(food.id)}
              className="rounded border-[#382820] bg-[#241A15] text-[#E9A052] focus:ring-0 w-4 h-4 cursor-pointer"
              title="Select dish for bulk actions"
            />
            <DietaryBadge type={food.veg_type} showText={true} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Freshness Badge */}
            <span
              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${freshness.className}`}
              title={`Last updated: ${formatFreshnessDate(food.updated_at)}`}
            >
              {freshness.label}
            </span>
          </div>
        </div>

        {/* Food Body: Image & Info */}
        <div className="flex items-start gap-3.5">
          {/* Food Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-[#382820] bg-[#241A15] flex items-center justify-center overflow-hidden shrink-0 relative">
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
            <div className={`no-photo-fallback text-center p-1 text-[#B6A69A]/60 ${food.image_url ? 'hidden' : 'block'}`}>
              <Tag className="w-5 h-5 mx-auto mb-0.5 stroke-1 text-[#B6A69A]/40" />
              <span className="text-[9px] font-medium block">No Photo</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-serif font-medium text-[#F5EDE5] truncate" title={food.name}>
                {food.name}
              </h4>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#B6A69A] mt-0.5 font-mono">
              <span>{formatFreshnessDate(food.updated_at)}</span>
              {food.prep_time_minutes && (
                <span className="inline-flex items-center gap-1 text-[#B6A69A]">
                  <Clock className="w-3 h-3 text-[#E9A052]" />
                  <span>{food.prep_time_minutes} min</span>
                </span>
              )}
            </div>

            {food.description && (
              <p className="text-xs text-[#B6A69A] line-clamp-2 mt-1 leading-relaxed font-sans">
                {food.description}
              </p>
            )}

            {/* Promotional or Base Price indicator */}
            {food.discount_price && food.base_price && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[#B6A69A]/60 line-through">
                  {formatCurrency(food.base_price)}
                </span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(food.discount_price)} Offer
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Variants & Pricing List */}
        <div className="mt-3 pt-2.5 border-t border-[#382820] space-y-1">
          {food.variants && food.variants.length > 0 ? (
            food.variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#241A15]/60 border border-[#382820]/40 hover:border-[#382820]"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      v.available ? 'bg-emerald-400' : 'bg-[#B6A69A]/40'
                    }`}
                  />
                  <span className="text-[#F5EDE5] font-sans font-medium">{v.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#E9A052]">{formatCurrency(v.price)}</span>
                  <button
                    type="button"
                    onClick={() => onViewPriceHistory(v, food.name)}
                    className="inline-flex items-center gap-0.5 text-[10px] text-[#B6A69A] hover:text-[#E9A052] font-mono"
                    title="Inspect price modification timeline"
                  >
                    <History className="w-2.5 h-2.5" />
                    <span>History</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#241A15]/60">
              <span className="text-xs text-[#B6A69A] font-sans">Base Price</span>
              <span className="font-mono font-bold text-[#E9A052]">
                {formatCurrency(food.base_price || 0)}
              </span>
            </div>
          )}
        </div>

        {/* Attached Add-ons Chips */}
        {food.addons && food.addons.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#382820] flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-mono uppercase text-[#B6A69A] mr-1">Add-ons:</span>
            {food.addons.map((ad) => (
              <span
                key={ad.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#241A15] border border-[#382820] text-[#F5EDE5] rounded text-[10px] font-mono"
              >
                <span>+{ad.name}</span>
                <span className="text-[#E9A052]">({formatCurrency(ad.price)})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Status & Actions */}
      <div className="mt-4 pt-3 border-t border-[#382820] flex items-center justify-between gap-2 flex-wrap">
        {/* Availability Toggle Status Button */}
        <button
          type="button"
          onClick={() => onToggleAvailability(food)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
            food.available
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
              : 'bg-[#241A15] text-[#B6A69A] border-[#382820] hover:text-[#F5EDE5]'
          }`}
          title="Click to toggle availability"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${food.available ? 'bg-emerald-400' : 'bg-[#B6A69A]'}`}
          />
          <span>{food.available ? 'Available' : 'Unavailable'}</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {freshness.status !== 'fresh' && (
            <button
              type="button"
              onClick={() => onConfirmFresh(food)}
              className="p-1.5 rounded-xl bg-[#241A15] text-[#E9A052] hover:bg-[#2C201A] border border-[#382820] transition-colors cursor-pointer"
              title="Confirm current price is accurate"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDuplicate(food)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-[#F5EDE5] border border-[#382820] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
            title="Duplicate dish"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(food)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-[#E9A052] border border-[#382820] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
            title="Edit dish details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(food)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-rose-400 border border-[#382820] hover:border-rose-800/60 transition-colors cursor-pointer"
            title="Delete dish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
