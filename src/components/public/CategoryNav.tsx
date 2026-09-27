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
      className="sticky top-16 z-20 bg-[#080808]/90 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-3 scrollbar-none">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <li key={cat.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded-lg transition-all border ${
                    isActive
                      ? 'bg-[#C5A064]/20 border-[#C5A064]/50 text-[#F4F2ED] shadow-sm font-semibold'
                      : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
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
