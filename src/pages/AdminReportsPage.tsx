import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { insforge, RestaurantReport } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { Flag, CheckCircle2, AlertCircle, Clock, Mail } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface EnrichedRestaurantReport extends RestaurantReport {
  restaurant?: { id: string; name: string; slug: string; area: string; city: string };
  food?: { id: string; name: string };
}

export const AdminReportsPage: React.FC = () => {
  useSEO({
    title: 'Admin Moderation Reports',
    noIndex: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const filterStatus = searchParams.get('status') || 'open';
  const targetId = searchParams.get('id');

  const [reports, setReports] = useState<EnrichedRestaurantReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EnrichedRestaurantReport | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Reports
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

      const resMap = new Map((resBatch.data || []).map((r: any) => [r.id, r]));
      const foodMap = new Map((foodBatch.data || []).map((f: any) => [f.id, f]));

      const enrichedReports = items.map((rep) => ({
        ...rep,
        restaurant: rep.restaurant_id ? (resMap.get(rep.restaurant_id) as any) : undefined,
        food: rep.food_id ? (foodMap.get(rep.food_id) as any) : undefined,
      }));

      setReports(enrichedReports);

      // Select target report if ID specified or default to first
      if (targetId) {
        const found = enrichedReports.find((r) => r.id === targetId);
        if (found) {
          setSelectedReport(found);
          setResolutionInput(found.resolution_notes || '');
        }
      } else if (enrichedReports.length > 0 && !selectedReport) {
        setSelectedReport(enrichedReports[0]);
        setResolutionInput(enrichedReports[0].resolution_notes || '');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, targetId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle Status Update Action
  const handleUpdateStatus = async (newStatus: 'investigating' | 'resolved' | 'dismissed') => {
    if (!selectedReport) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await insforge.database
        .from('restaurant_reports')
        .update({
          status: newStatus,
          resolution_notes: resolutionInput.trim() || null,
          resolved_at: newStatus === 'resolved' || newStatus === 'dismissed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) throw new Error(error.message);

      setSuccessMsg(`Report marked as "${newStatus}". Audit resolution recorded.`);
      setSelectedReport((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolution_notes: resolutionInput.trim() || null,
            }
          : null
      );
      loadReports();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Resolution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0807] text-[#FAF8F5] pb-20 relative">
      {/* Background Radial Glow */}
      <div
        className="absolute top-0 inset-x-0 h-[480px] pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(217,138,72,0.07)_0%,transparent_75%)]"
        aria-hidden="true"
      />

      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-cream-200/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-rose-300">
                Community Feedback Moderation
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-cream-100 tracking-tight">
              Customer Moderation Reports
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/60 mt-1 max-w-2xl font-sans leading-relaxed">
              Verify customer discrepancy reports regarding pricing accuracy, food availability, and establishment data.
            </p>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1">
            {(['all', 'open', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSearchParams({ status: st })}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-mono uppercase tracking-wider transition-all duration-200 capitalize shrink-0 cursor-pointer ${
                    filterStatus === st
                      ? 'bg-amber-400 text-[#0A0807] font-bold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-[#181310] border border-cream-200/15 text-cream-200/70 hover:text-cream-100 hover:border-amber-400/40'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Reports Table List (5 Columns) */}
          <div className="lg:col-span-5 editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-cream-200/10 bg-[#16110E] flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-rose-300 uppercase tracking-widest">
                Reports ({reports.length})
              </span>
              <span className="text-[11px] font-mono text-cream-200/40 uppercase">Click to inspect</span>
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-xs text-cream-200/50">
                <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                <span className="font-mono uppercase tracking-wider text-rose-300">Loading reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-16 text-center text-xs text-cream-200/40 font-sans">
                No customer reports found for &quot;{filterStatus}&quot;.
              </div>
            ) : (
              <div className="divide-y divide-cream-200/10 max-h-[75vh] overflow-y-auto scrollbar-thin">
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
                      className={`w-full text-left p-4 transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/10 border-l-4 border-l-rose-400 text-cream-100'
                          : 'hover:bg-cream-100/[0.03]'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30 inline-block mb-1.5">
                          {rep.report_type.replace(/_/g, ' ')}
                        </span>
                        <div className="text-sm font-serif font-normal text-cream-100 truncate">
                          {rep.restaurant?.name || 'Unknown Restaurant'}
                        </div>
                        {rep.food && (
                          <div className="text-xs text-cream-200/60 font-sans mt-0.5 truncate">
                            Dish: {rep.food.name}
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-cream-200/40 mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cream-200/40" />
                          <span>Reported {formatFreshnessDate(rep.created_at)}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/35'
                            : rep.status === 'investigating'
                            ? 'bg-blue-950/70 text-blue-300 border-blue-500/35'
                            : rep.status === 'dismissed'
                            ? 'bg-cream-100/10 text-cream-200/60 border-cream-200/20'
                            : 'bg-amber-950/70 text-amber-300 border-amber-500/35'
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
          <div className="lg:col-span-7 editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {!selectedReport ? (
              <div className="py-28 text-center text-xs text-cream-200/40 font-sans">
                <Flag className="w-10 h-10 mx-auto mb-3 text-cream-200/20 stroke-[1.5]" />
                <p className="text-sm text-cream-200/70 font-medium">Select a report to review</p>
                <p className="text-xs text-cream-200/40 mt-1">Inspect diner feedback, reporter details, and resolve menu inaccuracies.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="border-b border-cream-200/10 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                        {selectedReport.report_type.replace(/_/g, ' ')}
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl font-normal text-cream-100 tracking-tight mt-2">
                        {selectedReport.restaurant?.name || 'Restaurant Target'}
                      </h2>
                      <div className="text-xs text-cream-200/60 font-sans mt-0.5">
                        {selectedReport.restaurant?.area}, {selectedReport.restaurant?.city}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        selectedReport.status === 'resolved'
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/35'
                          : selectedReport.status === 'investigating'
                          ? 'bg-blue-950/70 text-blue-300 border-blue-500/35'
                          : selectedReport.status === 'dismissed'
                          ? 'bg-cream-100/10 text-cream-200/60 border-cream-200/20'
                          : 'bg-amber-950/70 text-amber-300 border-amber-500/35'
                      }`}
                    >
                      {selectedReport.status}
                    </span>
                  </div>

                  {selectedReport.food && (
                    <div className="mt-3 text-xs bg-[#181310] p-3 rounded-2xl border border-cream-200/10 flex items-center gap-2">
                      <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] font-semibold">
                        Specific Reported Dish:
                      </span>
                      <span className="font-serif text-cream-100 text-sm">{selectedReport.food.name}</span>
                    </div>
                  )}
                </div>

                {/* Submission Details */}
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-mono uppercase tracking-wider text-amber-300 text-[10px] block mb-1.5 font-semibold">
                      Customer Description / Details
                    </span>
                    <div className="p-4 bg-[#181310] rounded-2xl border border-cream-200/10 text-cream-100 leading-relaxed font-sans">
                      {selectedReport.details || 'No additional explanation provided by customer.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-[#181310] rounded-2xl border border-cream-200/10">
                      <span className="font-mono uppercase tracking-wider text-cream-200/50 text-[10px] block mb-1 font-semibold flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-amber-400" />
                        <span>Reporter Contact</span>
                      </span>
                      <span className="text-cream-100 font-mono text-[11px]">
                        {selectedReport.reporter_email || 'Anonymous submission'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#181310] rounded-2xl border border-cream-200/10">
                      <span className="font-mono uppercase tracking-wider text-cream-200/50 text-[10px] block mb-1 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Date Reported</span>
                      </span>
                      <span className="text-cream-100 font-sans">
                        {formatFreshnessDate(selectedReport.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Internal Resolution Notes */}
                <div className="pt-4 border-t border-cream-200/10 space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold">
                    Internal Admin Resolution Notes
                  </label>
                  <p className="text-[11px] text-cream-200/50 font-sans">
                    Document internal findings, corrections made with the shop owner, or reasons for report dismissal.
                  </p>
                  <textarea
                    rows={3}
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="e.g. Verified with owner, price updated in menu system..."
                    className="w-full text-xs font-sans bg-[#1C1512] border border-cream-200/15 rounded-xl p-3 text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-amber-400/60 leading-relaxed"
                  />
                </div>

                {/* Moderation Actions */}
                <div className="pt-4 border-t border-cream-200/10 flex flex-wrap gap-2.5 justify-end">
                  {selectedReport.status !== 'investigating' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('investigating')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-blue-950/60 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-blue-900/60 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      Mark as Investigating
                    </button>
                  )}

                  {selectedReport.status !== 'dismissed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('dismissed')}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-cream-200/15 text-cream-200 hover:text-cream-100 hover:bg-cream-100/[0.04] rounded-xl text-xs font-mono uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                  )}

                  {selectedReport.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                    >
                      Resolve Issue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
