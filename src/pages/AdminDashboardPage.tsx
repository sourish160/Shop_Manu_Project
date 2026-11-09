import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { fetchAdminMetrics, AdminMetrics, insforge, Restaurant, RestaurantReport } from '../lib/insforge';
import { Store, Flag, Clock, AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Shield } from 'lucide-react';
import { formatFreshnessDate } from '../utils/freshness';
import { useSEO } from '../hooks/useSEO';

export const AdminDashboardPage: React.FC = () => {
  useSEO({
    title: 'Admin Control Center',
    noIndex: true,
  });

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [pendingRestaurants, setPendingRestaurants] = useState<Restaurant[]>([]);
  const [openReports, setOpenReports] = useState<RestaurantReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch server-side authenticated metrics
      const m = await fetchAdminMetrics();
      setMetrics(m);

      // 2. Fetch pending restaurants preview (limit 5)
      const { data: pRes, error: pErr } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pErr) throw new Error(pErr.message);
      setPendingRestaurants((pRes || []) as Restaurant[]);

      // 3. Fetch open reports preview (limit 5)
      const { data: repList, error: repErr } = await insforge.database
        .from('restaurant_reports')
        .select('*')
        .in('status', ['pending', 'investigating'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (repErr) throw new Error(repErr.message);
      setOpenReports((repList || []) as RestaurantReport[]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load administrative overview.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cream-200/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-amber-300">
                Operations & Verification
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-cream-100 tracking-tight">
              Administrative Control Center
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/60 mt-1 max-w-2xl font-sans leading-relaxed">
              Live operational telemetry, shop verification pipelines, and customer feedback moderation.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAdminData}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-cream-200/15 bg-[#181310] hover:bg-[#221A15] hover:border-amber-400/40 text-cream-200 hover:text-amber-300 text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-300 block mb-1 uppercase tracking-wider font-mono text-[11px]">
                Administrative Authorization Error
              </span>
              <p className="font-sans leading-relaxed text-rose-200/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-28 text-center text-sm text-cream-200/60 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_12px_rgba(245,158,11,0.3)]" />
            <span className="font-mono text-xs uppercase tracking-widest text-amber-300">
              Synchronizing Admin Telemetry...
            </span>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Primary Operational Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
              {/* Card 1: Pending */}
              <div className="editorial-card bg-[#120E0C] border border-amber-400/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-400/60 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/10 via-transparent to-transparent pointer-events-none" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block mb-1.5 font-semibold">
                  Pending Review
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-amber-400 block tracking-tight">
                  {metrics?.pending_restaurants ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  Awaiting verification
                </span>
              </div>

              {/* Card 2: Approved */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block mb-1.5 font-semibold">
                  Approved
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-emerald-300 block tracking-tight">
                  {metrics?.approved_restaurants ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  Publicly discoverable
                </span>
              </div>

              {/* Card 3: Suspended */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cream-200/25 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/60 block mb-1.5 font-semibold">
                  Suspended
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-cream-200 block tracking-tight">
                  {metrics?.suspended_restaurants ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  Hidden from search
                </span>
              </div>

              {/* Card 4: Open Reports */}
              <div className="editorial-card bg-[#120E0C] border border-rose-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 block mb-1.5 font-semibold">
                  Open Reports
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-rose-300 block tracking-tight">
                  {metrics?.open_reports ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  Customer feedback
                </span>
              </div>

              {/* Card 5: Stale Menus */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cream-200/25 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/60 block mb-1.5 font-semibold">
                  Stale Menus
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-cream-200 block tracking-tight">
                  {metrics?.stale_menu_count ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  Unchecked in 60+ days
                </span>
              </div>

              {/* Card 6: Active Foods */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-400/30 transition-all">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cream-200/60 block mb-1.5 font-semibold">
                  Active Foods
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-normal text-amber-300 block tracking-tight">
                  {metrics?.total_foods ?? 0}
                </span>
                <span className="text-[11px] font-sans text-cream-200/60 mt-1.5 block">
                  In approved menus
                </span>
              </div>
            </div>

            {/* Urgent Moderation Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Restaurants Section */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-cream-200/10 pb-4 mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                        <Store className="w-4 h-4 text-amber-400" />
                      </div>
                      <h2 className="font-serif text-lg font-normal text-cream-100">
                        Pending Restaurant Submissions
                      </h2>
                    </div>
                    <Link
                      to="/admin/restaurants?status=pending"
                      className="text-xs font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                    >
                      <span>View all ({metrics?.pending_restaurants ?? 0})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {pendingRestaurants.length === 0 ? (
                    <div className="py-12 text-center text-cream-200/40 text-xs font-sans">
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-2.5 text-emerald-500 stroke-[1.5]" />
                      <p className="text-cream-200/70 font-medium">All submissions reviewed.</p>
                      <p className="text-[11px] text-cream-200/40 mt-1">No pending restaurant applications in queue.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRestaurants.map((res) => (
                        <div
                          key={res.id}
                          className="p-4 rounded-2xl bg-[#181310] border border-cream-200/10 hover:border-amber-400/30 transition-all flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-serif font-normal text-cream-100 truncate">
                              {res.name}
                            </div>
                            <div className="text-xs text-cream-200/60 font-sans mt-0.5">
                              {res.area}, {res.city} &bull; <span className="font-mono text-[11px]">{res.phone}</span>
                            </div>
                            <div className="text-[10px] font-mono text-cream-200/40 mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-400/80" />
                              <span>Submitted {formatFreshnessDate(res.created_at)}</span>
                            </div>
                          </div>
                          <Link
                            to={`/admin/restaurants?id=${res.id}`}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-[#E8A856] text-[#0A0807] font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all shadow-md shrink-0"
                          >
                            Review
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Open Reports Section */}
              <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-cream-200/10 pb-4 mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                        <Flag className="w-4 h-4 text-rose-400" />
                      </div>
                      <h2 className="font-serif text-lg font-normal text-cream-100">
                        Open Customer Reports
                      </h2>
                    </div>
                    <Link
                      to="/admin/reports?status=open"
                      className="text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 flex items-center gap-1.5"
                    >
                      <span>View all ({metrics?.open_reports ?? 0})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {openReports.length === 0 ? (
                    <div className="py-12 text-center text-cream-200/40 text-xs font-sans">
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-2.5 text-emerald-500 stroke-[1.5]" />
                      <p className="text-cream-200/70 font-medium">Moderation queue is clear.</p>
                      <p className="text-[11px] text-cream-200/40 mt-1">No open customer feedback reports require resolution.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {openReports.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-4 rounded-2xl bg-[#181310] border border-cream-200/10 hover:border-rose-500/30 transition-all flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <span className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 mb-1.5">
                              {rep.report_type.replace(/_/g, ' ')}
                            </span>
                            <div className="text-xs text-cream-200/90 font-sans line-clamp-1 leading-relaxed">
                              {rep.details || 'No additional details provided'}
                            </div>
                            <div className="text-[10px] font-mono text-cream-200/40 mt-1.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-rose-400/80" />
                              <span>Reported {formatFreshnessDate(rep.created_at)}</span>
                            </div>
                          </div>
                          <Link
                            to={`/admin/reports?id=${rep.id}`}
                            className="px-3.5 py-1.5 bg-[#221A15] border border-cream-200/15 text-cream-200 hover:text-cream-100 hover:border-amber-400/40 font-sans font-medium text-xs uppercase tracking-wider rounded-xl transition-all shrink-0"
                          >
                            Inspect
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Audit Trail Overview */}
            <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cream-200/10 pb-4 mb-4 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-cream-100">
                    Audit Logging Security Trail
                  </h3>
                </div>
                <Link
                  to="/admin/audit"
                  className="text-xs font-mono uppercase tracking-wider text-amber-300 hover:text-amber-200 flex items-center gap-1.5"
                >
                  <span>Review full audit ledger ({metrics?.total_audit_logs ?? 0} events)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs sm:text-[13px] text-cream-200/60 leading-relaxed font-sans">
                All sensitive administrative actions (restaurant verification, rejections, suspensions, and report closures) are permanently recorded in the immutable audit log table with administrative user IDs, before/after states, IP tracking, and microsecond timestamps.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
