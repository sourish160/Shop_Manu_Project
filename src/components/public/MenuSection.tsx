import React from 'react';
import { Category, Food, Combo } from '../../lib/insforge';
import { FoodItemCard } from './FoodItemCard';
import { DietaryBadge } from '../menu/DietaryBadge';
import { formatCurrency } from '../../utils/formatters';
import { Utensils, Package, Sparkles } from 'lucide-react';
import { resolveMenuItemImage, MENU_IMAGE_MAP } from '../cinematic/menuAssets';

interface MenuSectionProps {
  categories: Category[];
  foods: Food[];
  combos?: Combo[];
  onReportDish?: (food: Food) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  foods,
  combos = [],
  onReportDish,
}) => {
  if (foods.length === 0 && combos.length === 0) {
    return (
      <div className="py-16 text-center editorial-card bg-[#120E0C] border border-cream-200/10 p-8 my-6 rounded-sm">
        <Utensils className="w-8 h-8 text-cream-300/30 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-medium text-cream-100 mb-1">
          Menu Under Preparation
        </h3>
        <p className="text-xs text-cream-300/60 max-w-sm mx-auto">
          This shop hasn't published active menu items yet. Check back soon.
        </p>
      </div>
    );
  }

  // Group foods by category_id
  const foodsByCategory = new Map<string, Food[]>();
  const uncategorizedFoods: Food[] = [];

  foods.forEach((food) => {
    if (food.category_id) {
      const existing = foodsByCategory.get(food.category_id) || [];
      existing.push(food);
      foodsByCategory.set(food.category_id, existing);
    } else {
      uncategorizedFoods.push(food);
    }
  });

  return (
    <div className="space-y-12 py-8">
      {/* Combos Showcase Section if any exist (Section 19) */}
      {combos.length > 0 && (
        <section id="category-combos" className="scroll-mt-32">
          <div className="border-b border-cream-200/10 pb-3 mb-6 flex items-baseline justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-2xl font-medium text-cream-100 tracking-tight">
                Combos & Value Meals
              </h2>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-cream-300/50">
              {combos.length} {combos.length === 1 ? 'deal' : 'deals'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {combos.map((combo) => {
              const original = Number(combo.original_price) || 0;
              const comboPrice = Number(combo.combo_price) || 0;
              const savings = Number(combo.savings) > 0 ? Number(combo.savings) : Math.max(0, original - comboPrice);
              const discountPercent = original > 0 && savings > 0 ? Math.round((savings / original) * 100) : 0;

              return (
                <article
                  key={combo.id}
                  className={`editorial-card bg-[#120E0C] border border-cream-200/10 p-5 hover:border-amber-400/40 transition-all flex flex-col justify-between rounded-sm ${
                    combo.available ? '' : 'opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <DietaryBadge type={combo.veg_type || 'non_veg'} showText={true} size="sm" />
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                          combo.available
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-cream-200/5 text-cream-300/40 border-cream-200/10'
                        }`}
                      >
                        {combo.available ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#181310] border border-cream-200/10 overflow-hidden shrink-0 rounded-sm relative">
                        <img
                          src={resolveMenuItemImage(combo)}
                          alt={combo.name}
                          className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.05]"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = MENU_IMAGE_MAP.thali;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0807]/30 via-transparent to-transparent pointer-events-none" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-medium text-cream-100 leading-snug">
                          {combo.name}
                        </h3>
                        {combo.description && (
                          <p className="mt-1 text-xs text-cream-300/70 leading-relaxed line-clamp-2">
                            {combo.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Included Items */}
                    {combo.items && combo.items.length > 0 && (
                      <div className="mt-4 p-3 bg-[#181310] border border-cream-200/10 text-xs font-mono text-cream-300/80 rounded-xs">
                        <span className="font-medium text-[10px] uppercase tracking-wider text-cream-300/50 block mb-1">
                          Includes:
                        </span>
                        <ul className="space-y-1">
                          {combo.items.map((ci, idx) => (
                            <li key={ci.id || idx} className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-300">{ci.quantity} ×</span>
                              <span className="text-cream-200">{ci.food?.name || 'Dish Item'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Price & Savings */}
                  <div className="mt-5 pt-3.5 border-t border-cream-200/10 flex items-center justify-between">
                    <div>
                      {original > comboPrice && (
                        <span className="text-xs font-mono text-cream-300/40 line-through block">
                          {formatCurrency(original)}
                        </span>
                      )}
                      <span className="font-serif text-xl font-medium text-amber-300">
                        {formatCurrency(comboPrice)}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono rounded-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Save {formatCurrency(savings)} {discountPercent > 0 && `(${discountPercent}%)`}</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Category Sections */}
      {categories.map((category) => {
        const catFoods = foodsByCategory.get(category.id) || [];
        if (catFoods.length === 0) return null;

        return (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="scroll-mt-32"
          >
            <div className="border-b border-cream-200/10 pb-3 mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="font-serif text-2xl font-medium text-cream-100 tracking-tight">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-xs text-cream-300/60 mt-1">{category.description}</p>
                )}
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-cream-300/50">
                {catFoods.length} {catFoods.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {catFoods.map((food) => (
                <FoodItemCard
                  key={food.id}
                  food={food}
                  onReportDish={onReportDish}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Uncategorized items if any exist */}
      {uncategorizedFoods.length > 0 && (
        <section id="category-uncategorized" className="scroll-mt-32">
          <div className="border-b border-cream-200/10 pb-3 mb-6 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-medium text-cream-100 tracking-tight">
              Other Menu Items
            </h2>
            <span className="font-mono text-xs uppercase tracking-wider text-cream-300/50">
              {uncategorizedFoods.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uncategorizedFoods.map((food) => (
              <FoodItemCard
                key={food.id}
                food={food}
                onReportDish={onReportDish}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
