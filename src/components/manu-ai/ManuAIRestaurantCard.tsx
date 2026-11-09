import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2, ArrowRight, Utensils } from 'lucide-react';
import { AIRestaurantItem } from '../../services/manuAIService';

interface ManuAIRestaurantCardProps {
  restaurant: AIRestaurantItem;
}

export const ManuAIRestaurantCard: React.FC<ManuAIRestaurantCardProps> = ({ restaurant }) => {
  return (
    <div className="group relative bg-[#14100D]/90 hover:bg-[#1A1410] border border-cream-200/10 hover:border-amber-400/30 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-amber-950/20">
      <div>
        {/* Top: Category pill + Verified */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300/90 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
            {restaurant.category || 'Culinary Destination'}
          </span>

          {restaurant.verified && (
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Kitchen</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="font-serif text-lg text-cream-100 font-normal leading-snug group-hover:text-amber-200 transition-colors">
          {restaurant.name}
        </h4>

        {restaurant.description && (
          <p className="text-xs text-cream-200/70 font-sans line-clamp-2 mt-1.5 leading-relaxed">
            {restaurant.description}
          </p>
        )}

        {/* Address & Territory */}
        <div className="flex items-start space-x-1.5 text-xs text-cream-200/60 mt-3 font-sans">
          <MapPin className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{restaurant.address}, {restaurant.area}</span>
        </div>

        {restaurant.distance_km != null && (
          <div className="text-[11px] font-mono text-amber-300 mt-1 pl-5">
            Distance: {restaurant.distance_km} km away
          </div>
        )}
      </div>

      {/* Bottom: Food count + View Menu Button */}
      <div className="mt-4 pt-3 border-t border-cream-200/10 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-cream-200/60 font-mono">
          <Utensils className="w-3 h-3 text-amber-400/60" />
          <span>{restaurant.active_food_count || 'Direct'} Active Items</span>
        </div>

        <Link
          to={`/restaurant/${restaurant.slug}`}
          className="inline-flex items-center space-x-1 text-xs font-sans font-medium text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1 rounded-full transition-all group-hover:translate-x-0.5"
        >
          <span>View Kitchen</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

