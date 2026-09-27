import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { insforge, RestaurantReport, adminUpdateReportStatus } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface ReportWithRelations extends RestaurantReport {
  restaurant?: { id: string; name: string; slug: string; area: string; city: string };
  food?: { id: string; name: string };
}

export const AdminReportsPage: React.FC = () => {
  useSEO({
    title: 'Admin User Reports',
    noIndex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') || 'all';
  const targetId = searchParams.get('id');

  const [reports, setReports] = useState<ReportWithRelations[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithRelations | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let query = insforge.database
        .from('restaurant_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus === 'open') {
        query = query.in('status', ['pending', 'investigating']);
      } else if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const items = (data || []) as RestaurantReport[];

      // Fetch restaurant & food names in batch
      const resIds = [...new Set(items.map((r) => r.restaurant_id).filter(Boolean))];
      const foodIds = [...new Set(items.map((r) => r.food_id).filter(Boolean))] as string[];

      const [resBatch, foodBatch] = await Promise.all([
        resIds.length > 0
          ? insforge.database.from('restaurants').select('id, name, slug, area, city').in('id', resIds)
          : Promise.resolve({ data: [] }),
        foodIds.length > 0
          ? insforge.database.from('foods').select('id, name').in('id', foodIds)
          : Promise.resolve({ data: [] }),
      ]);

      const resMap = new Map((resBatch.data || []).map((r) => [r.id, r]));
      const foodMap = new Map((foodBatch.data || []).map((f) => [f.id, f]));

      const enriched: ReportWithRelations[] = items.map((rep) => ({
        ...rep,
        restaurant: resMap.get(rep.restaurant_id),
        food: rep.food_id ? foodMap.get(rep.food_id) : undefined,
      }));

      setReports(enriched);

      if (targetId) {
        const found = enriched.find((r) => r.id === targetId);
        if (found) {
          setSelectedReport(found);
          setResolutionInput(found.resolution_notes || '');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load customer reports.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, targetId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleUpdateStatus = async (
    newStatus: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  ) => {
    if (!selectedReport) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await adminUpdateReportStatus(
        selectedReport.id,
        newStatus,
        resolutionInput.trim() || null
      );

      setSuccessMsg(`Report status updated to ${newStatus.toUpperCase()}.`);

      const updated = {
        ...selectedReport,
        status: newStatus,
        resolution_notes: resolutionInput.trim() || selectedReport.resolution_notes,
      };
      setSelectedReport(updated);
      await loadReports();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Customer Moderation Reports
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer feedback regarding pricing accuracy, availability, and establishment data.
            </p>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {(['all', 'open', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setSearchParams({ status: st })}
                  className={`text-xs px-3 py-1.5 rounded font-medium capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports Table List (5 Columns) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Reports ({reports.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No customer reports found for &quot;{filterStatus}&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[75vh] overflow-y-auto">
                {reports.map((rep) => {
                  const isSelected = selectedReport?.id === rep.id;
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => {
                        setSelectedReport(rep);
                        setResolutionInput(rep.resolution_notes || '');
                        setSearchParams({ status: filterStatus, id: rep.id });
                      }}
                      className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-100/90 border-l-4 border-l-slate-900'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block mb-1">
                          {rep.report_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          {rep.restaurant?.name || 'Unknown Restaurant'}
                        </div>
                        {rep.food && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Dish: {rep.food.name}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Reported {formatFreshnessDate(rep.created_at)}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rep.status === 'investigating'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : rep.status === 'dismissed'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Report Detail & Resolution Panel (7 Columns) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 shadow-xs">
            {!selectedReport ? (
              <div className="py-24 text-center text-xs text-slate-400">
                <Flag className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                Select a report from the list to review customer submission and resolve issue.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {selectedReport.report_type.replace(/_/g, ' ')}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                        {selectedReport.restaurant?.name || 'Restaurant Target'}
                      </h2>
                      <div className="text-xs text-slate-500">
                        {selectedReport.restaurant?.area}, {selectedReport.restaurant?.city}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
                        selectedReport.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedReport.status === 'investigating'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : selectedReport.status === 'dismissed'
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>

                  {selectedReport.food && (
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-semibold text-slate-700">Specific Reported Dish:</span>{' '}
                      <span className="text-slate-900">{selectedReport.food.name}</span>
                    </div>
                  )}
                </div>

                {/* Submission Details */}
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
                      Customer Description / Details
                    </span>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed">
                      {selectedReport.details || 'No additional explanation provided by customer.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 block mb-0.5">
                        Reporter Contact
                      </span>
                      <span className="text-slate-800 font-mono text-[11px]">
                        {selectedReport.reporter_email || 'Anonymous submission'}
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 block mb-0.5">
                        Date Reported
                      </span>
                      <span className="text-slate-800">
                        {formatFreshnessDate(selectedReport.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Internal Resolution Notes */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Internal Admin Resolution Notes
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Document internal findings, corrections made, or reason for dismissal. Saved to audit trail.
                  </p>
                  <textarea
                    rows={3}
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="e.g. Verified with owner, price updated in menu system..."
                    className="w-full text-xs border border-slate-300 rounded p-2.5 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Moderation Actions */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                  {selectedReport.status !== 'investigating' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('investigating')}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 bg-blue-50 border border-blue-300 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      Mark as Investigating
                    </button>
                  )}

                  {selectedReport.status !== 'dismissed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('dismissed')}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      Dismiss Report
                    </button>
                  )}

                  {selectedReport.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
                    >
                      Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
