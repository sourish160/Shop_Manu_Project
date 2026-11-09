import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, TrendingDown, TrendingUp, Scale } from 'lucide-react';
import { AIComparisonItem } from '../../services/manuAIService';

interface ManuAIComparisonCardProps {
  items: AIComparisonItem[];
  meta?: {
    min_price?: number;
    max_price?: number;
    avg_price?: number;
    dish_query?: string;
  };
}

export const ManuAIComparisonCard: React.FC<ManuAIComparisonCardProps> = ({ items, meta }) => {
  if (!items || items.length === 0) return null;

  // Compute min, max, avg if not present in meta
  const prices = items.map(i => Number(i.price)).filter(p => !isNaN(p));
  const minPrice = meta?.min_price ?? (prices.length > 0 ? Math.min(...prices) : 0);
  const maxPrice = meta?.max_price ?? (prices.length > 0 ? Math.max(...prices) : 0);
  const avgPrice = meta?.avg_price ?? (prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0);

  return (
    <div className="bg-[#14100D]/95 border border-amber-500/25 rounded-2xl p-4 sm:p-5 my-2 shadow-xl backdrop-blur-md">
      {/* Header with Comparison Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-cream-200/10">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-base text-cream-100 font-normal">
              Portion Price Benchmark
            </h4>
            <span className="text-[10px] font-mono text-cream-200/50 uppercase tracking-wider">
              {items.length} Verified Kitchens Compared
            </span>
          </div>
        </div>

        {/* Metrics Pill Grid */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <TrendingDown className="w-3 h-3" />
            <span>Low: ₹{minPrice}</span>
          </div>
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <span>Avg: ₹{avgPrice}</span>
          </div>
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <TrendingUp className="w-3 h-3" />
            <span>High: ₹{maxPrice}</span>
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {items.map((item, idx) => {
          const isLowest = item.price === minPrice;
          return (
            <div
              key={`${item.restaurant_id}_${item.food_id}_${idx}`}
              className={`p-3 rounded-xl border transition-all ${
                isLowest
                  ? 'bg-amber-400/[0.07] border-amber-400/40 shadow-sm shadow-amber-950/20'
                  : 'bg-[#181310]/80 border-cream-200/10 hover:border-cream-200/20'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <Link
                  to={`/restaurant/${item.restaurant_slug}`}
                  className="font-sans font-semibold text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 truncate"
                >
                  <span className="truncate">{item.restaurant_name}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </Link>
                <span className="text-[10px] font-mono text-cream-200/50 shrink-0">
                  {item.area}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xs text-cream-200 font-sans truncate pr-2">
                  {item.food_name} <span className="text-cream-200/60 text-[11px]">({item.variant_name})</span>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className={`text-sm font-sans font-bold ${isLowest ? 'text-amber-300' : 'text-cream-100'}`}>
                    ₹{item.price}
                  </span>
                  {isLowest && (
                    <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-medium">
                      Best Value
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

