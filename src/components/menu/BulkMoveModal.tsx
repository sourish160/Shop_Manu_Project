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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-move-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden p-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <FolderSymlink className="w-4 h-4" />
            </div>
            <div>
              <h3 id="bulk-move-title" className="text-sm font-bold text-slate-900">
                Move Dishes to Category
              </h3>
              <p className="text-xs text-slate-500">
                Reassigning {selectedCount} selected {selectedCount === 1 ? 'dish' : 'dishes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Destination Category *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 shadow-sm"
            >
              {isSubmitting ? 'Moving...' : 'Move Dishes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
