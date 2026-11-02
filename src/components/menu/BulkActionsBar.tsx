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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1C1512] text-[#F5EDE5] px-4 py-3 rounded-2xl shadow-2xl border border-[#382820] flex flex-wrap items-center gap-2 sm:gap-3 text-xs animate-in fade-in slide-in-from-bottom-4 duration-150 max-w-2xl w-[94%] sm:w-auto">
      <div className="flex items-center gap-2 border-r border-[#382820] pr-3 mr-1">
        <CheckSquare className="w-4 h-4 text-[#E9A052]" />
        <span className="font-serif font-medium whitespace-nowrap text-[#F5EDE5]">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={onMarkAvailable}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#241A15] hover:bg-[#2C201A] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl font-medium text-emerald-400 transition-colors disabled:opacity-50 cursor-pointer"
          title="Mark selected dishes available"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Available</span>
        </button>

        <button
          type="button"
          onClick={onMarkUnavailable}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#241A15] hover:bg-[#2C201A] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl font-medium text-[#B6A69A] hover:text-[#F5EDE5] transition-colors disabled:opacity-50 cursor-pointer"
          title="Mark selected dishes unavailable"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Unavailable</span>
        </button>

        <button
          type="button"
          onClick={onMoveCategory}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#241A15] hover:bg-[#2C201A] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl font-medium text-[#F5EDE5] transition-colors disabled:opacity-50 cursor-pointer"
          title="Move dishes to another category"
        >
          <FolderSymlink className="w-3.5 h-3.5 text-[#E9A052]" />
          <span>Move Category</span>
        </button>

        <button
          type="button"
          onClick={onUpdatePrice}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#241A15] hover:bg-[#2C201A] border border-[#382820] hover:border-[#E9A052]/40 rounded-xl font-medium text-[#F5EDE5] transition-colors disabled:opacity-50 cursor-pointer"
          title="Batch update prices"
        >
          <DollarSign className="w-3.5 h-3.5 text-[#E9A052]" />
          <span>Update Price</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isProcessing}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/80 rounded-xl font-medium text-rose-300 transition-colors disabled:opacity-50 cursor-pointer"
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
        className="ml-auto text-[#B6A69A] hover:text-[#F5EDE5] p-1 rounded-xl transition-colors cursor-pointer"
        title="Deselect all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
