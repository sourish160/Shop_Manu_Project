import React from 'react';
import { Combo, ComboType } from '../../lib/insforge';
import { DietaryBadge } from './DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { Package, Edit3, Copy, Trash2 } from 'lucide-react';

interface ComboCardProps {
  combo: Combo;
  isSelected?: boolean;
  onSelect?: (comboId: string) => void;
  onEdit: (combo: Combo) => void;
  onDuplicate: (combo: Combo) => void;
  onDelete: (combo: Combo) => void;
  onToggleAvailability: (combo: Combo) => void;
}

const COMBO_TYPE_LABELS: Record<ComboType, string> = {
  single: 'Single Combo',
  meal: 'Meal Combo',
  family: 'Family Combo',
  couple: 'Couple Combo',
  party: 'Party Combo',
  breakfast: 'Breakfast Combo',
  lunch: 'Lunch Combo',
  dinner: 'Dinner Combo',
};

export const ComboCard: React.FC<ComboCardProps> = ({
  combo,
  isSelected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleAvailability,
}) => {
  const typeLabel = COMBO_TYPE_LABELS[combo.combo_type] || 'Combo Package';
  const original = Number(combo.original_price) || 0;
  const comboPrice = Number(combo.combo_price) || 0;
  const savings = Number(combo.savings) > 0 ? Number(combo.savings) : Math.max(0, original - comboPrice);
  const discountPercent = original > 0 && savings > 0 ? Math.round((savings / original) * 100) : 0;

  return (
    <div
      className={`border rounded-2xl bg-[#1C1512] p-4 sm:p-5 transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-[#E9A052] ring-2 ring-[#E9A052]/20 shadow-md bg-[#241A15]'
          : 'border-[#382820] hover:border-[#E9A052]/40 hover:shadow-lg'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#382820]">
          <div className="flex items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(combo.id)}
                className="rounded border-[#382820] bg-[#241A15] text-[#E9A052] focus:ring-0 w-4 h-4 cursor-pointer"
                title="Select combo for bulk actions"
              />
            )}
            <DietaryBadge type={combo.veg_type} showText={true} size="sm" />
          </div>

          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#241A15] text-[#E9A052] border border-[#382820]">
            {typeLabel}
          </span>
        </div>

        {/* Body info */}
        <div className="flex items-start gap-3.5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-[#382820] bg-[#241A15] flex items-center justify-center overflow-hidden shrink-0 relative">
            {combo.image_url ? (
              <img
                src={combo.image_url}
                alt={combo.name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Package className="w-7 h-7 text-[#E9A052]/60 stroke-1" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-serif font-medium text-[#F5EDE5] truncate" title={combo.name}>
              {combo.name}
            </h4>

            {combo.description && (
              <p className="text-xs text-[#B6A69A] line-clamp-2 mt-1 leading-relaxed font-sans">
                {combo.description}
              </p>
            )}

            <div className="mt-2 flex items-baseline gap-2 font-mono">
              <span className="text-base font-bold text-[#E9A052]">{formatCurrency(comboPrice)}</span>
              {original > comboPrice && (
                <span className="text-xs text-[#B6A69A]/50 line-through">
                  {formatCurrency(original)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                  Save {discountPercent}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Combo items list */}
        {combo.items && combo.items.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#382820] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#B6A69A] block mb-1">Includes:</span>
            {combo.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded bg-[#241A15]/60 text-[#F5EDE5]"
              >
                <span className="truncate">{it.food?.name || 'Dish'}</span>
                <span className="font-mono text-[#E9A052] text-[11px] shrink-0 ml-2">×{it.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="mt-4 pt-3 border-t border-[#382820] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleAvailability(combo)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
            combo.available
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
              : 'bg-[#241A15] text-[#B6A69A] border-[#382820] hover:text-[#F5EDE5]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${combo.available ? 'bg-emerald-400' : 'bg-[#B6A69A]'}`}
          />
          <span>{combo.available ? 'Available' : 'Unavailable'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDuplicate(combo)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-[#F5EDE5] border border-[#382820] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
            title="Duplicate combo"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(combo)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-[#E9A052] border border-[#382820] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
            title="Edit combo"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(combo)}
            className="p-1.5 rounded-xl bg-[#241A15] text-[#B6A69A] hover:text-rose-400 border border-[#382820] hover:border-rose-800/60 transition-colors cursor-pointer"
            title="Delete combo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
