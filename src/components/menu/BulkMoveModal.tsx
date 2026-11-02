import React, { useState } from 'react';
import { Category } from '../../lib/insforge';
import { FolderSymlink, X } from 'lucide-react';

interface BulkMoveModalProps {
  isOpen: boolean;
  selectedCount: number;
  categories: Category[];
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmMove: (targetCategoryId: string) => Promise<void>;
}

export const BulkMoveModal: React.FC<BulkMoveModalProps> = ({
  isOpen,
  selectedCount,
  categories,
  isSubmitting,
  onClose,
  onConfirmMove,
}) => {
  const [targetId, setTargetId] = useState(categories[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      setErrorMsg('Please select a target category.');
      return;
    }
    setErrorMsg(null);
    try {
      await onConfirmMove(targetId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to move dishes.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-move-title"
        className="bg-[#1C1512] rounded-2xl border border-[#382820] shadow-2xl max-w-sm w-full overflow-hidden p-6 text-[#F5EDE5]"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#382820]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
              <FolderSymlink className="w-4 h-4" />
            </div>
            <div>
              <h3 id="bulk-move-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
                Move Dishes to Category
              </h3>
              <p className="text-xs text-[#B6A69A]">
                Reassigning {selectedCount} selected {selectedCount === 1 ? 'dish' : 'dishes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1 rounded-xl hover:bg-[#241A15] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
              Destination Category *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1C1512] text-[#F5EDE5]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
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
              className="px-4 py-2 bg-[#E9A052] text-[#100D0B] rounded-xl text-xs font-semibold hover:bg-[#d89345] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Moving...' : 'Move Dishes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
