import React, { useEffect, useState } from 'react';
import { insforge, FoodVariant, PriceHistory } from '../../lib/insforge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { History, X, ArrowRight, User } from 'lucide-react';

interface PriceHistoryModalProps {
  variant: FoodVariant | null;
  foodName?: string;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  variant,
  foodName,
  onClose,
}) => {
  const [records, setRecords] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!variant) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await insforge.database
          .from('price_history')
          .select('*')
          .eq('food_variant_id', variant.id)
          .order('changed_at', { ascending: false });

        if (error) throw new Error(error.message);

        if (isMounted) {
          setRecords((data || []) as PriceHistory[]);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load price history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [variant]);

  if (!variant) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-history-title"
        className="bg-white rounded-md border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-200/80 text-slate-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="price-history-title" className="text-sm font-bold text-slate-900">
                Price History
              </h3>
              <p className="text-xs text-slate-500">
                {foodName ? <span className="font-semibold text-slate-700">{foodName}</span> : 'Dish'}{' '}
                — Variant: <span className="font-medium text-slate-700">{variant.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current price bar */}
        <div className="px-5 py-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Current Live Price</span>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(variant.price)}</span>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading price history records...
            </div>
          ) : errorMsg ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
              {errorMsg}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-medium text-slate-600">No previous price changes recorded.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                The price will automatically track and record here whenever modified.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        {formatCurrency(rec.old_price)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(rec.new_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>{formatDateTime(rec.changed_at)}</span>
                      {rec.changed_by && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <User className="w-3 h-3" />
                          <span>Owner</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      Number(rec.new_price) > Number(rec.old_price)
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {Number(rec.new_price) > Number(rec.old_price) ? 'Increased' : 'Decreased'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
