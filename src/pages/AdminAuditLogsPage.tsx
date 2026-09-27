import React, { useEffect, useState, useCallback } from 'react';
import { AdminNav } from '../components/AdminNav';
import { insforge, AuditLog } from '../lib/insforge';
import { formatFreshnessDate } from '../utils/freshness';
import { ClipboardList, AlertCircle, ChevronDown, ChevronRight, User, Calendar } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const AdminAuditLogsPage: React.FC = () => {
  useSEO({
    title: 'Admin Audit Logs',
    noIndex: true,
  });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>('all');

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
    <div className="min-h-screen bg-slate-50 pb-16">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrative Audit Log Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of sensitive platform operations, status changes, and moderation decisions.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Entity:</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
            >
              <option value="all">All Entities</option>
              <option value="restaurant">Restaurants</option>
              <option value="restaurant_report">Reports</option>
              <option value="profile">Profiles</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Recorded Events ({logs.length})
            </span>
            <span className="text-[11px] text-slate-400">Latest 100 entries</span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading verified audit entries...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              No audit records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setExpandedLogId(isExpanded ? null : log.id);
                        }
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex items-start sm:items-center space-x-3">
                        <span className="text-slate-400 mt-0.5 sm:mt-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {log.entity_type}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Target ID: {log.entity_id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-500 shrink-0 pl-7 sm:pl-0">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <User className="w-3 h-3 text-slate-400" />
                          {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatFreshnessDate(log.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Before/After JSON Diff View */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 pl-7 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                            Before State (old_data)
                          </span>
                          <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                            {log.old_data ? JSON.stringify(log.old_data, null, 2) : 'null'}
                          </pre>
                        </div>

                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                            After State (new_data)
                          </span>
                          <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
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
      </div>
    </div>
  );
};
