import React, { useState, useEffect } from 'react';
import { Category } from '../../lib/insforge';
import { ArrowUp, ArrowDown, GripVertical, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reorder-modal-title"
        className="bg-[#1C1512] rounded-3xl border border-[#382820] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] text-[#F5EDE5]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#382820] flex items-center justify-between bg-[#241A15]">
          <div>
            <h3 id="reorder-modal-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
              Reorder Menu Categories
            </h3>
            <p className="text-[11px] text-[#B6A69A]">
              Drag or use arrows to change the order displayed to customers.
            </p>
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

        {/* Categories list */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {items.map((cat, idx) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors cursor-move ${
                draggedIndex === idx
                  ? 'bg-[#241A15] border-[#E9A052] shadow-md'
                  : 'bg-[#241A15] border-[#382820] hover:border-[#E9A052]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GripVertical className="w-4 h-4 text-[#B6A69A]" />
                <span className="w-5 h-5 rounded-full bg-[#1C1512] text-[#E9A052] font-mono font-bold flex items-center justify-center text-[10px] border border-[#382820]">
                  {idx + 1}
                </span>
                <span className="font-medium text-[#F5EDE5]">{cat.name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0 || isSubmitting}
                  className="p-1 text-[#B6A69A] hover:text-[#E9A052] hover:bg-[#1C1512] rounded-lg disabled:opacity-20 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1 || isSubmitting}
                  className="p-1 text-[#B6A69A] hover:text-[#E9A052] hover:bg-[#1C1512] rounded-lg disabled:opacity-20 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#382820] flex items-center justify-end gap-2.5 bg-[#241A15]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-[#382820] rounded-xl text-xs font-medium text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#1C1512] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#E9A052] hover:bg-amber-400 text-[#100D0B] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSubmitting ? 'Saving Order...' : 'Save Category Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
