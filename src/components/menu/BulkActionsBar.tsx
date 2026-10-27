import React from 'react';
import { CheckSquare, Eye, EyeOff, FolderSymlink, DollarSign, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onMarkAvailable: () => void;
  onMarkUnavailable: () => void;
  onMoveCategory: () => void;
  onUpdatePrice: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onMarkAvailable,
  onMarkUnavailable,
  onMoveCategory,
  onUpdatePrice,
  onDelete,
  onClearSelection,
  isProcessing = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 flex flex-wrap items-center gap-2 sm:gap-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-150 max-w-2xl w-[94%] sm:w-auto">
      <div className="flex items-center gap-2 border-r border-slate-700 pr-3 mr-1">
        <CheckSquare className="w-4 h-4 text-emerald-400" />
        <span className="font-bold whitespace-nowrap">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onMarkAvailable}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded font-semibold text-emerald-300 transition-colors disabled:opacity-50"
          title="Mark selected dishes available"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Available</span>
        </button>

        <button
          type="button"
          onClick={onMarkUnavailable}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded font-semibold text-slate-300 transition-colors disabled:opacity-50"
          title="Mark selected dishes unavailable"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Unavailable</span>
        </button>

        <button
          type="button"
          onClick={onMoveCategory}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded font-semibold text-white transition-colors disabled:opacity-50"
          title="Move dishes to another category"
        >
          <FolderSymlink className="w-3.5 h-3.5" />
          <span>Move Category</span>
        </button>

        <button
          type="button"
          onClick={onUpdatePrice}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded font-semibold text-white transition-colors disabled:opacity-50"
          title="Batch update prices"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Update Price</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800/80 rounded font-semibold text-rose-300 transition-colors disabled:opacity-50"
          title="Delete selected dishes"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        disabled={isProcessing}
        className="ml-auto text-slate-400 hover:text-white p-1 rounded transition-colors"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
