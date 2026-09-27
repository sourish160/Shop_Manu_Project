import React, { useState } from 'react';
import { Food, insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  foods: Food[];
  preselectedFood?: Food | null;
}

const REPORT_TYPES = [
  { value: 'wrong_price', label: 'Wrong price' },
  { value: 'food_unavailable', label: 'Food unavailable' },
  { value: 'incorrect_info', label: 'Incorrect restaurant information' },
  { value: 'restaurant_closed', label: 'Restaurant closed' },
  { value: 'incorrect_location', label: 'Incorrect location' },
  { value: 'other', label: 'Other' },
] as const;

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  foods,
  preselectedFood,
}) => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<string>(
    preselectedFood ? 'wrong_price' : 'incorrect_info'
  );
  const [selectedFoodId, setSelectedFoodId] = useState<string>(preselectedFood?.id || '');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!details.trim() && reportType === 'other') {
      setErrorMsg('Please provide a brief explanation for "Other".');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await insforge.database
        .from('restaurant_reports')
        .insert([
          {
            restaurant_id: restaurantId,
            food_id: selectedFoodId || null,
            report_type: reportType,
            details: details.trim() || null,
            reporter_email: reporterEmail.trim() || null,
            user_id: user?.id || null,
            status: 'pending',
          },
        ]);

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMsg(null);
    setDetails('');
    setSelectedFoodId('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="forge-card rounded-2xl border border-white/15 shadow-2xl max-w-md w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white text-xl leading-none transition-colors"
          aria-label="Close report dialog"
        >
          &times;
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3 font-mono">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              &#10003;
            </div>
            <h3 id="report-modal-title" className="font-editorial text-2xl font-light text-[#F4F2ED]">
              Notice Recorded
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Thank you for keeping {restaurantName} telemetry accurate. Our moderation team will review this notice.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="forge-btn px-5 py-2 text-xs uppercase tracking-widest text-[#F4F2ED] rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 id="report-modal-title" className="font-editorial text-2xl sm:text-3xl font-light text-[#F4F2ED] tracking-tight">
                Submit Information Notice
              </h3>
              <p className="font-mono text-xs text-zinc-400 mt-1">
                Help ensure accurate pricing & availability for {restaurantName}.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-mono text-red-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="report-type" className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5">
                Issue Category *
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs font-mono border border-white/15 rounded-xl px-3.5 py-2 bg-[#0C0C0C] text-[#F4F2ED] focus:outline-none focus:border-[#C5A064] cursor-pointer"
                required
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {(reportType === 'wrong_price' || reportType === 'food_unavailable') && (
              <div>
                <label htmlFor="report-food" className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5">
                  Specific Dish (Optional)
                </label>
                <select
                  id="report-food"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full text-xs font-mono border border-white/15 rounded-xl px-3.5 py-2 bg-[#0C0C0C] text-[#F4F2ED] focus:outline-none focus:border-[#C5A064] cursor-pointer"
                >
                  <option value="">General menu item issue</option>
                  {foods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="report-details" className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5">
                Details or Corrections
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What seems incorrect? Provide accurate info if you know it."
                className="w-full text-xs font-mono border border-white/15 rounded-xl px-3.5 py-2 text-[#F4F2ED] bg-white/5 placeholder-zinc-500 focus:outline-none focus:border-[#C5A064] resize-none"
              />
            </div>

            <div>
              <label htmlFor="reporter-email" className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-[#C5A064] mb-1.5">
                Your Email (Optional, for follow-up)
              </label>
              <input
                id="reporter-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="visitor@example.com"
                className="w-full text-xs font-mono border border-white/15 rounded-xl px-3.5 py-2 text-[#F4F2ED] bg-white/5 placeholder-zinc-500 focus:outline-none focus:border-[#C5A064]"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-white/15 rounded-xl uppercase tracking-wider text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="forge-btn px-5 py-2 uppercase tracking-widest text-[#F4F2ED] rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
