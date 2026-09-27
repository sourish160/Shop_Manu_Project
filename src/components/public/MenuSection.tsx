import React from 'react';
import { Category, Food } from '../../lib/insforge';
import { FoodItemCard } from './FoodItemCard';

interface MenuSectionProps {
  categories: Category[];
  foods: Food[];
  onReportDish?: (food: Food) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  foods,
  onReportDish,
}) => {
  if (foods.length === 0) {
    return (
      <div className="py-20 text-center forge-card rounded-2xl p-8 my-6">
        <h3 className="font-editorial text-2xl font-light text-[#F4F2ED] mb-2">
          Menu Catalog In Curation
        </h3>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 max-w-sm mx-auto">
          This atelier kitchen has not published active specimens yet. Check back soon.
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
      {categories.map((category) => {
        const catFoods = foodsByCategory.get(category.id) || [];
        if (catFoods.length === 0) return null;

        return (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="scroll-mt-32"
          >
            <div className="border-b border-white/10 pb-3 mb-5 flex items-baseline justify-between">
              <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] tracking-tight">
                {category.name}
              </h2>
              <span className="font-mono text-xs text-[#C5A064] uppercase tracking-wider">
                {catFoods.length} {catFoods.length === 1 ? 'specimen' : 'specimens'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <div className="border-b border-white/10 pb-3 mb-5 flex items-baseline justify-between">
            <h2 className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] tracking-tight">
              Other Specialties
            </h2>
            <span className="font-mono text-xs text-[#C5A064] uppercase tracking-wider">
              {uncategorizedFoods.length} specimens
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
