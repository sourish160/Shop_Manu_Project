import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminNav } from '../components/AdminNav';
import { fetchAdminMetrics, AdminMetrics, insforge, Restaurant, RestaurantReport } from '../lib/insforge';
import { Store, Flag, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrative Control Center
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational monitoring, restaurant verification, and moderation.
            </p>
          </div>
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="self-start sm:self-auto px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Administrative Authorization Error</span>
              {errorMsg}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
            <span>Loading verified administrative data...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary Operational Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white border border-amber-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 block mb-1">
                  Pending Review
                </span>
                <span className="text-2xl font-bold text-amber-900 block">
                  {metrics?.pending_restaurants ?? 0}
                </span>
                <span className="text-[11px] text-amber-700 mt-1 block">
                  Awaiting verification
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Approved
                </span>
                <span className="text-2xl font-bold text-slate-900 block">
                  {metrics?.approved_restaurants ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Publicly discoverable
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Suspended
                </span>
                <span className="text-2xl font-bold text-slate-900 block">
                  {metrics?.suspended_restaurants ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Hidden from public
                </span>
              </div>

              <div className="bg-white border border-rose-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-800 block mb-1">
                  Open Reports
                </span>
                <span className="text-2xl font-bold text-rose-900 block">
                  {metrics?.open_reports ?? 0}
                </span>
                <span className="text-[11px] text-rose-700 mt-1 block">
                  Customer feedback
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Stale Menus
                </span>
                <span className="text-2xl font-bold text-slate-900 block">
                  {metrics?.stale_menu_count ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Not updated in 60+ days
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Active Foods
                </span>
                <span className="text-2xl font-bold text-slate-900 block">
                  {metrics?.total_foods ?? 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  In approved menus
                </span>
              </div>
            </div>

            {/* Urgent Moderation Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Restaurants Section */}
              <div className="bg-white border border-slate-200 rounded p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-amber-700" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Pending Restaurant Submissions
                      </h2>
                    </div>
                    <Link
                      to="/admin/restaurants?status=pending"
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      View all ({metrics?.pending_restaurants ?? 0}) <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {pendingRestaurants.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-600 stroke-[1.5]" />
                      No pending restaurant applications. All submissions reviewed.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pendingRestaurants.map((res) => (
                        <div key={res.id} className="py-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{res.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {res.area}, {res.city} &bull; Phone: {res.phone}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Submitted {formatFreshnessDate(res.created_at)}
                            </div>
                          </div>
                          <Link
                            to={`/admin/restaurants?id=${res.id}`}
                            className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition-colors shrink-0"
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
              <div className="bg-white border border-slate-200 rounded p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Flag className="w-4 h-4 text-rose-700" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Open Customer Reports
                      </h2>
                    </div>
                    <Link
                      to="/admin/reports?status=open"
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      View all ({metrics?.open_reports ?? 0}) <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {openReports.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-600 stroke-[1.5]" />
                      No open customer reports. Moderation queue is clear.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {openReports.map((rep) => (
                        <div key={rep.id} className="py-3 flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 mb-1">
                              {rep.report_type.replace(/_/g, ' ')}
                            </span>
                            <div className="text-xs text-slate-700 line-clamp-1">
                              {rep.details || 'No additional details provided'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Reported {formatFreshnessDate(rep.created_at)}
                            </div>
                          </div>
                          <Link
                            to={`/admin/reports?id=${rep.id}`}
                            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-[11px] font-medium hover:bg-slate-50 transition-colors shrink-0"
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
            <div className="border border-slate-200 bg-white rounded p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Audit Logging Status
                </h3>
                <Link
                  to="/admin/audit"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  View audit log ({metrics?.total_audit_logs ?? 0} events) &rarr;
                </Link>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All sensitive administrative actions (restaurant verification, rejections, suspensions, and report closures) are recorded in the immutable audit log table with user IDs, before/after states, and exact timestamps.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
