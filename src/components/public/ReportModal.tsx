import React, { useState } from 'react';
import { Food, insforge } from '../../lib/insforge';
import { useAuth } from '../../context/AuthContext';
import { Check, X, AlertTriangle } from 'lucide-react';
import { sanitizeErrorMessage } from '../../utils/errorHandler';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  foods: Food[];
  preselectedFood?: Food | null;
}

const REPORT_TYPES = [
  { value: 'wrong_price', label: 'Wrong price listed' },
  { value: 'food_unavailable', label: 'Dish is unavailable / sold out' },
  { value: 'incorrect_info', label: 'Incorrect restaurant information' },
  { value: 'restaurant_closed', label: 'Restaurant is closed' },
  { value: 'incorrect_location', label: 'Incorrect location / map pin' },
  { value: 'other', label: 'Other issue' },
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
      setErrorMsg(sanitizeErrorMessage(err, 'Failed to submit report.'));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="editorial-card bg-[#14100D] border border-cream-200/15 shadow-2xl max-w-md w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto rounded-sm">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-cream-300/60 hover:text-amber-300 transition-colors p-1"
          aria-label="Close report dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold rounded-sm">
              <Check className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 id="report-modal-title" className="font-serif text-2xl font-medium text-cream-100">
              Report Submitted
            </h3>
            <p className="text-xs text-cream-300/70 max-w-sm mx-auto leading-relaxed">
              Thank you for keeping {restaurantName} menu information accurate. Our moderation team will review this report.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold text-[#0A0807] bg-amber-400 hover:bg-amber-300 transition-colors rounded-xs"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-1 font-mono text-[10px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report Menu Issue</span>
              </div>
              <h3 id="report-modal-title" className="font-serif text-2xl font-medium text-cream-100 tracking-tight">
                Report an Issue
              </h3>
              <p className="text-xs text-cream-300/60 mt-1">
                Help ensure accurate pricing & availability for {restaurantName}.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-xs font-mono text-red-200 rounded-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="report-type" className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1">
                Issue Category <span className="text-amber-400">*</span>
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs font-mono border border-cream-200/15 px-3 py-2 bg-[#1A1512] text-cream-100 focus:outline-none focus:border-amber-400/60 cursor-pointer rounded-xs"
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
                <label htmlFor="report-food" className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1">
                  Specific Dish (Optional)
                </label>
                <select
                  id="report-food"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full text-xs font-mono border border-cream-200/15 px-3 py-2 bg-[#1A1512] text-cream-100 focus:outline-none focus:border-amber-400/60 cursor-pointer rounded-xs"
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
              <label htmlFor="report-details" className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1">
                Details or Corrections
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What seems incorrect? Provide accurate info if you know it."
                className="w-full text-xs border border-cream-200/15 px-3 py-2 text-cream-100 bg-[#1A1512] placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 resize-none font-sans rounded-xs"
              />
            </div>

            <div>
              <label htmlFor="reporter-email" className="block text-[10px] font-mono uppercase tracking-wider text-cream-300/60 mb-1">
                Your Email (Optional)
              </label>
              <input
                id="reporter-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs border border-cream-200/15 px-3 py-2 text-cream-100 bg-[#1A1512] placeholder-cream-300/30 focus:outline-none focus:border-amber-400/60 font-mono rounded-xs"
              />
              <p className="text-[10px] text-cream-300/50 mt-1 leading-relaxed">
                Privacy promise: Strictly optional. Only used if a platform moderator needs clarification. Never shared with the restaurant.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-cream-200/10 text-xs">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-cream-200/15 text-cream-300/70 hover:bg-cream-200/5 hover:text-cream-100 transition-colors font-mono uppercase tracking-wider rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-[#0A0807] bg-amber-400 hover:bg-amber-300 font-mono uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 rounded-xs"
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
