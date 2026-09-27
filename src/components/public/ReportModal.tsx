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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg leading-none"
          aria-label="Close report dialog"
        >
          &times;
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
              &#10003;
            </div>
            <h3 id="report-modal-title" className="text-base font-bold text-slate-900">
              Report Submitted
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Thank you for keeping {restaurantName} information accurate. Our moderation team will review this notice.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 id="report-modal-title" className="text-base font-bold text-slate-900">
                Report Incorrect Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Help us keep information accurate for {restaurantName}.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <div>
              <label htmlFor="report-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Category *
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
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
                <label htmlFor="report-food" className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Dish (Optional)
                </label>
                <select
                  id="report-food"
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
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
              <label htmlFor="report-details" className="block text-xs font-semibold text-slate-700 mb-1">
                Details or Corrections
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="What seems incorrect? Provide accurate info if you know it."
                className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 resize-none"
              />
            </div>

            <div>
              <label htmlFor="reporter-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Your Email (Optional, for follow-up)
              </label>
              <input
                id="reporter-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
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
