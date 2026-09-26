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
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <li key={cat.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
