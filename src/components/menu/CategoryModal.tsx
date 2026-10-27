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
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save category.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-200/80 text-slate-800 flex items-center justify-center">
              {category ? <FolderEdit className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="category-modal-title" className="text-sm font-bold text-slate-900">
                {category ? 'Rename Category' : 'Add New Category'}
              </h3>
              <p className="text-xs text-slate-500">
                Organize menu items into logical groups for customers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {localError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
              {localError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Traditional rice dishes prepared with aromatic spices..."
              rows={2}
              maxLength={300}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Display Order
            </label>
            <input
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              disabled={isSubmitting}
              className="w-28 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-700"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Lower numbers appear first on the menu.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
