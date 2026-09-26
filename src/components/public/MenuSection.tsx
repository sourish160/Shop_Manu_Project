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
      <div className="py-16 text-center bg-white border border-slate-200 rounded-md p-8 my-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          No menu available yet
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This restaurant has not published any active menu items yet. Check back soon.
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
    <div className="space-y-10 py-6">
      {categories.map((category) => {
        const catFoods = foodsByCategory.get(category.id) || [];
        if (catFoods.length === 0) return null;

        return (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="scroll-mt-14"
          >
            <div className="border-b border-slate-200 pb-2 mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {category.name}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {catFoods.length} {catFoods.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <section id="category-uncategorized" className="scroll-mt-14">
          <div className="border-b border-slate-200 pb-2 mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Other Specialties
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {uncategorizedFoods.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
