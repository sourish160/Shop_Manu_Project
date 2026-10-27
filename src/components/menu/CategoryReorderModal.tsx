import React, { useState, useEffect } from 'react';
import { Category } from '../../lib/insforge';
import { ArrowUp, ArrowDown, GripVertical, X, Check } from 'lucide-react';

interface CategoryReorderModalProps {
  isOpen: boolean;
  categories: Category[];
  isSubmitting: boolean;
  onClose: () => void;
  onSaveOrder: (orderedCategories: Category[]) => Promise<void>;
}

export const CategoryReorderModal: React.FC<CategoryReorderModalProps> = ({
  isOpen,
  categories,
  isSubmitting,
  onClose,
  onSaveOrder,
}) => {
  const [items, setItems] = useState<Category[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems([...categories].sort((a, b) => a.sort_order - b.sort_order));
  }, [categories, isOpen]);

  if (!isOpen) return null;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setItems(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveItem(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    const updatedWithOrder = items.map((cat, idx) => ({
      ...cat,
      sort_order: idx + 1,
    }));
    await onSaveOrder(updatedWithOrder);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-modal-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 id="reorder-modal-title" className="text-sm font-bold text-slate-900">
              Reorder Menu Categories
            </h3>
            <p className="text-xs text-slate-500">
              Drag or use arrows to change the order displayed to customers.
            </p>
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

        {/* Categories list */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {items.map((cat, idx) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 rounded-md border text-xs transition-colors cursor-move ${
                draggedIndex === idx
                  ? 'bg-slate-100 border-slate-400 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-900">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0 || isSubmitting}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1 || isSubmitting}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
