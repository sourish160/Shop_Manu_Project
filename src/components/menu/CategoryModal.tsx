import React, { useState, useEffect } from 'react';
import { Category } from '../../lib/insforge';
import { FolderPlus, FolderEdit, X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  currentCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; description: string; sort_order: number }) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  currentCount,
  isSubmitting,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setSortOrder(category.sort_order ?? 0);
    } else {
      setName('');
      setDescription('');
      setSortOrder(currentCount);
    }
    setLocalError(null);
  }, [category, currentCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      setLocalError('Category name must be between 2 and 100 characters.');
      return;
    }

    setLocalError(null);
    try {
      await onSave({
        name: cleanName,
        description: description.trim(),
        sort_order: Number(sortOrder) || 0,
      });
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Failed to save category.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="bg-[#1C1512] rounded-3xl border border-[#382820] shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#382820] flex items-center justify-between bg-[#241A15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C1512] border border-[#382820] text-[#E9A052] flex items-center justify-center">
              {category ? <FolderEdit className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="category-modal-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
                {category ? 'Rename Category' : 'Add New Category'}
              </h3>
              <p className="text-[11px] text-[#B6A69A]">
                Organize menu items into logical groups for customers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1.5 rounded-lg hover:bg-[#1C1512] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {localError && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300">
              {localError}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biryani, Starters, Main Course, Desserts"
              required
              maxLength={100}
              autoFocus
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary shown to diners viewing this category..."
              rows={2}
              maxLength={250}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] placeholder-[#B6A69A]/50 focus:outline-none focus:border-[#E9A052] focus:ring-1 focus:ring-[#E9A052] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#B6A69A] mb-1.5">
              Display Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              min={0}
              disabled={isSubmitting}
              className="w-24 px-3 py-1.5 text-xs bg-[#241A15] border border-[#382820] rounded-xl text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
            />
            <span className="text-[11px] text-[#B6A69A] ml-2 font-mono">
              (Lower numbers appear first)
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#382820] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#382820] rounded-xl text-xs font-medium text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#241A15] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
