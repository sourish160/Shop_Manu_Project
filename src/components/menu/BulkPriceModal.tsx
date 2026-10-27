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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-price-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden p-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 id="bulk-price-title" className="text-sm font-bold text-slate-900">
                Bulk Update Prices
              </h3>
              <p className="text-xs text-slate-500">
                Adjust prices for {selectedCount} selected {selectedCount === 1 ? 'dish' : 'dishes'}
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
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="fixed_add">Increase by fixed amount (₹)</option>
              <option value="fixed_sub">Decrease by fixed amount (₹)</option>
              <option value="percent_add">Increase by percentage (%)</option>
              <option value="percent_sub">Decrease by percentage (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Value {adjustmentType.startsWith('percent') ? '(%)' : '(₹)'} *
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 20"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-800"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Every price change will be securely logged to price history.
            </span>
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
              {isSubmitting ? 'Updating...' : 'Apply Price Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
