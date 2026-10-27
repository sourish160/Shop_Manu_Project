import React from 'react';
import { Category } from '../../lib/insforge';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-16 z-20 bg-[#0A0807]/92 backdrop-blur-md border-b border-cream-200/10 shadow-xl"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex items-center space-x-2.5 overflow-x-auto py-3 scrollbar-none">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <li key={cat.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-espresso-950 border-amber-500 font-semibold shadow-md'
                      : 'bg-[#14100D] border-cream-200/15 text-cream-200/70 hover:bg-cream-100/[0.08] hover:text-cream-100'
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
