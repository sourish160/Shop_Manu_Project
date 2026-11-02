import React, { useState } from 'react';
import { DollarSign, X } from 'lucide-react';

interface BulkPriceModalProps {
  isOpen: boolean;
  selectedCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmPriceUpdate: (adjustmentType: 'fixed_add' | 'fixed_sub' | 'percent_add' | 'percent_sub', amount: number) => Promise<void>;
}

export const BulkPriceModal: React.FC<BulkPriceModalProps> = ({
  isOpen,
  selectedCount,
  isSubmitting,
  onClose,
  onConfirmPriceUpdate,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'fixed_add' | 'fixed_sub' | 'percent_add' | 'percent_sub'>('fixed_add');
  const [amount, setAmount] = useState('20');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }
    setErrorMsg(null);
    try {
      await onConfirmPriceUpdate(adjustmentType, num);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update prices.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-price-title"
        className="bg-[#1C1512] rounded-2xl border border-[#382820] shadow-2xl max-w-sm w-full overflow-hidden p-6 text-[#F5EDE5]"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#382820]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#241A15] text-[#E9A052] border border-[#382820] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 id="bulk-price-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
                Bulk Update Prices
              </h3>
              <p className="text-xs text-[#B6A69A]">
                Adjust prices for {selectedCount} selected {selectedCount === 1 ? 'dish' : 'dishes'}
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
              Adjustment Type *
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
            >
              <option value="fixed_add" className="bg-[#1C1512] text-[#F5EDE5]">Increase Price by Fixed (₹)</option>
              <option value="fixed_sub" className="bg-[#1C1512] text-[#F5EDE5]">Decrease Price by Fixed (₹)</option>
              <option value="percent_add" className="bg-[#1C1512] text-[#F5EDE5]">Increase Price by Percentage (%)</option>
              <option value="percent_sub" className="bg-[#1C1512] text-[#F5EDE5]">Decrease Price by Percentage (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-[#B6A69A] uppercase tracking-wider mb-1.5">
              Adjustment Value {adjustmentType.includes('percent') ? '(%)' : '(₹)'} *
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-[#382820] rounded-xl bg-[#241A15] text-[#F5EDE5] focus:outline-none focus:border-[#E9A052]"
            />
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
              {isSubmitting ? 'Updating...' : 'Update Prices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
