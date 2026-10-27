import React from 'react';
import { Combo, ComboType } from '../../lib/insforge';
import { DietaryBadge } from './DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { Package, Sparkles, Edit3, Copy, Trash2 } from 'lucide-react';

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
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(combo.id)}
                className="rounded border-slate-300 text-slate-900 focus:ring-0 w-4 h-4 cursor-pointer"
                title="Select combo"
              />
            )}
            <DietaryBadge type={combo.veg_type} showText={true} size="sm" />
          </div>

          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {typeLabel}
          </span>
        </div>

        {/* Combo Header: Image & Name */}
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {combo.image_url ? (
              <img
                src={combo.image_url}
                alt={combo.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-1 text-slate-400">
                <Package className="w-5 h-5 mx-auto mb-0.5 stroke-1" />
                <span className="text-[9px] font-medium block">Combo</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate" title={combo.name}>
              {combo.name}
            </h4>

            {combo.description && (
              <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                {combo.description}
              </p>
            )}
          </div>
        </div>

        {/* Included Items List */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 bg-slate-50/60 p-2.5 rounded">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Included Items ({combo.items?.length || 0})
          </span>
          {combo.items && combo.items.length > 0 ? (
            <ul className="space-y-1">
              {combo.items.map((ci, idx) => (
                <li
                  key={ci.id || idx}
                  className="flex items-center justify-between text-xs text-slate-700"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-900">{ci.quantity} ×</span>
                    <span className="truncate">{ci.food?.name || 'Dish Item'}</span>
                  </div>
                  {ci.food?.variants?.[0]?.price && (
                    <span className="text-[11px] text-slate-400 shrink-0">
                      ({formatCurrency(ci.food.variants[0].price)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-slate-400 italic">No item list details loaded</span>
          )}
        </div>

        {/* Price & Savings Summary */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div>
            {original > 0 && original > comboPrice && (
              <span className="text-xs text-slate-400 line-through block font-medium">
                {formatCurrency(original)}
              </span>
            )}
            <span className="text-base font-extrabold text-slate-900">
              {formatCurrency(comboPrice)}
            </span>
          </div>

          {savings > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Save {formatCurrency(savings)} {discountPercent > 0 && `(${discountPercent}%)`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onToggleAvailability(combo)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-colors border ${
            combo.available
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
          title="Click to toggle combo availability"
        >
          <span
            className={`w-2 h-2 rounded-full ${combo.available ? 'bg-emerald-600' : 'bg-slate-400'}`}
          />
          <span>{combo.available ? 'Available' : 'Unavailable'}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(combo)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
            title="Duplicate combo"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(combo)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
            title="Edit combo"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(combo)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors"
            title="Remove combo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
