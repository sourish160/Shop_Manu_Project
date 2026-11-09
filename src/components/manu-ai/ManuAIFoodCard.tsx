import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2, MapPin } from 'lucide-react';
import { AIFoodItem } from '../../services/manuAIService';

interface ManuAIFoodCardProps {
  food: AIFoodItem;
}

export const ManuAIFoodCard: React.FC<ManuAIFoodCardProps> = ({ food }) => {
  const isVeg = food.veg_type === 'veg';
  const hasMultipleVariants = (food.variants?.length || 0) > 1;

  return (
    <div className="group relative bg-[#14100D]/90 hover:bg-[#1A1410] border border-cream-200/10 hover:border-amber-400/30 rounded-2xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-amber-950/20">
      <div>
        {/* Top: Veg indicator + Restaurant link */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Veg symbol */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span
              className={`w-3.5 h-3.5 border flex items-center justify-center rounded-[3px] ${
                isVeg ? 'border-emerald-500/80' : 'border-rose-500/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isVeg ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cream-200/60">
              {isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Restaurant Pill */}
          <Link
            to={`/restaurant/${food.restaurant_slug}`}
            className="flex items-center space-x-1 text-[11px] font-sans font-medium text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-full transition-colors truncate max-w-[170px]"
          >
            <span className="truncate">{food.restaurant_name}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
          </Link>
        </div>

        {/* Dish Title & Description */}
        <h4 className="font-serif text-base sm:text-lg text-cream-100 font-normal leading-snug group-hover:text-amber-200 transition-colors">
          {food.name}
        </h4>

        {food.description && (
          <p className="text-xs text-cream-200/70 font-sans line-clamp-2 mt-1 leading-relaxed">
            {food.description}
          </p>
        )}

        {/* Area / Distance */}
        <div className="flex items-center space-x-1 text-[11px] text-cream-200/50 mt-2 font-mono">
          <MapPin className="w-3 h-3 text-amber-400/70 shrink-0" />
          <span className="truncate">{food.restaurant_area}, {food.restaurant_city}</span>
          {food.distance_km != null && (
            <span className="text-amber-300 font-semibold shrink-0">· {food.distance_km} km</span>
          )}
        </div>
      </div>

      {/* Price & Variants section */}
      <div className="mt-3.5 pt-2.5 border-t border-cream-200/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/50 block">
            {hasMultipleVariants ? 'Portion Rates' : 'Portion Rate'}
          </span>
          <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
            {food.variants && food.variants.length > 0 ? (
              food.variants.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center text-xs font-sans font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md"
                >
                  <span className="font-normal text-cream-200/70 text-[10px] mr-1">{v.name}:</span>
                  ₹{v.price}
                </span>
              ))
            ) : (
              <span className="text-sm font-sans font-semibold text-amber-300">
                {food.display_price_text || `₹${food.starting_price || ''}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 text-[10px] text-emerald-400/80 font-mono shrink-0 pl-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Verified</span>
        </div>
      </div>
    </div>
  );
};

