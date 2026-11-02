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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-history-title"
        className="bg-[#1C1512] rounded-2xl border border-[#382820] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] text-[#F5EDE5]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#382820] flex items-center justify-between bg-[#241A15]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C1512] text-[#E9A052] border border-[#382820] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="price-history-title" className="text-sm font-serif font-medium text-[#F5EDE5]">
                Price History
              </h3>
              <p className="text-xs text-[#B6A69A]">
                {foodName ? <span className="font-semibold text-[#F5EDE5]">{foodName}</span> : 'Dish'}{' '}
                — Portion: <span className="text-[#E9A052]">{variant.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B6A69A] hover:text-[#F5EDE5] p-1 rounded-xl hover:bg-[#1C1512] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current price bar */}
        <div className="px-5 py-3 bg-[#241A15]/60 border-b border-[#382820] flex items-center justify-between text-xs">
          <span className="text-[#B6A69A]">Current Live Price</span>
          <span className="text-sm font-mono font-bold text-[#E9A052]">{formatCurrency(variant.price)}</span>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#B6A69A]">
              Loading price history records...
            </div>
          ) : errorMsg ? (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs font-medium text-[#F5EDE5]">No previous price changes recorded.</p>
              <p className="text-[11px] text-[#B6A69A] mt-1">
                The price will automatically track and record here whenever modified.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-[#241A15] border border-[#382820] rounded-xl hover:border-[#E9A052]/30 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-[#B6A69A]/70 line-through">
                        {formatCurrency(rec.old_price)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E9A052]" />
                      <span className="text-xs font-mono font-bold text-[#F5EDE5]">
                        {formatCurrency(rec.new_price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#B6A69A]">
                      <span>{formatDateTime(rec.changed_at)}</span>
                      {rec.changed_by && (
                        <span className="inline-flex items-center gap-1 text-[#E9A052]/80">
                          <User className="w-3 h-3" />
                          <span>Owner</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      Number(rec.new_price) > Number(rec.old_price)
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    }`}
                  >
                    {Number(rec.new_price) > Number(rec.old_price) ? 'Price Raised' : 'Discount / Drop'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
