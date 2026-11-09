import React, { useEffect, useState, useCallback } from 'react';
import { AdminNav } from '../components/AdminNav';
import { insforge, AuditLog } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { ClipboardList, ChevronDown, ChevronRight, User, Calendar, AlertCircle, Shield } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const AdminAuditLogsPage: React.FC = () => {
  useSEO({
    title: 'Admin Audit Logs',
    noIndex: true,
  });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let query = insforge.database
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterEntity !== 'all') {
        query = query.eq('entity_type', filterEntity);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      setLogs((data || []) as AuditLog[]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [filterEntity]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

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
                Immutable Ledger
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-cream-100 tracking-tight">
              Administrative Audit Log Trail
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/60 mt-1 max-w-2xl font-sans leading-relaxed">
              Cryptographically timestamped audit trail of sensitive moderation operations, status changes, and administrative interventions.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-mono uppercase tracking-wider text-cream-200/50">Filter:</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="text-xs font-mono uppercase tracking-wider border border-cream-200/15 rounded-xl px-3.5 py-2 bg-[#181310] text-cream-100 focus:outline-none focus:border-amber-400/60 cursor-pointer shadow-sm"
            >
              <option value="all">All Entities</option>
              <option value="restaurant">Restaurants</option>
              <option value="restaurant_report">Reports</option>
              <option value="profile">Profiles</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 sm:p-5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 backdrop-blur-sm shadow-xl">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <div className="editorial-card bg-[#120E0C] border border-cream-200/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-5 border-b border-cream-200/10 bg-[#16110E] flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-amber-300 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Recorded Events ({logs.length})</span>
            </span>
            <span className="text-[11px] font-mono text-cream-200/40 uppercase">Latest 100 entries</span>
          </div>

          {isLoading ? (
            <div className="py-24 text-center text-xs text-cream-200/50">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
              <span className="font-mono uppercase tracking-wider text-amber-300">Loading verified audit ledger...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-xs text-cream-200/40 font-sans">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-cream-200/20 stroke-[1.5]" />
              <p className="text-cream-200/70 font-medium">No audit records found.</p>
              <p className="text-xs text-cream-200/40 mt-1">Actions taken by administrators will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-200/10">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="p-4 sm:p-5 hover:bg-cream-100/[0.02] transition-colors">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setExpandedLogId(isExpanded ? null : log.id);
                        }
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start sm:items-center space-x-3.5">
                        <span className="text-amber-400 mt-0.5 sm:mt-0 shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                            <span className="text-xs font-mono font-bold text-cream-100 tracking-wider">
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                              {log.entity_type}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-cream-200/50 mt-1">
                            Target ID: <span className="text-cream-200/70">{log.entity_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-cream-200/50 shrink-0 pl-7 sm:pl-0">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <User className="w-3.5 h-3.5 text-amber-400/80" />
                          <span>{log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-cream-200/40" />
                          <span>{formatFreshnessDate(log.created_at)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Expandable Before/After JSON Diff View */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-cream-200/10 pl-7 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 bg-[#181310] rounded-2xl border border-cream-200/10">
                          <span className="font-mono uppercase tracking-wider text-rose-400 text-[10px] block mb-2 font-semibold">
                            Before State (old_data)
                          </span>
                          <pre className="text-[11px] font-mono text-cream-200/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 scrollbar-thin">
                            {log.old_data ? JSON.stringify(log.old_data, null, 2) : 'null'}
                          </pre>
                        </div>

                        <div className="p-4 bg-[#181310] rounded-2xl border border-cream-200/10">
                          <span className="font-mono uppercase tracking-wider text-emerald-400 text-[10px] block mb-2 font-semibold">
                            After State (new_data)
                          </span>
                          <pre className="text-[11px] font-mono text-cream-200/80 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 scrollbar-thin">
                            {log.new_data ? JSON.stringify(log.new_data, null, 2) : 'null'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
