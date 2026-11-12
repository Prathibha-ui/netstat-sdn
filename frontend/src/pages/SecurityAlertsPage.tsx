import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SecurityLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertOctagon, RefreshCw, ShieldAlert, AlertTriangle, Search } from 'lucide-react';

export const SecurityAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    try {
      const data = await api.getSecurityAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter((a) => {
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesSearch =
      a.observed_mac.toLowerCase().includes(search.toLowerCase()) ||
      (a.student_id && a.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (a.student_name && a.student_name.toLowerCase().includes(search.toLowerCase())) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      a.event_type.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Security Incident Alerts & Violations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time notifications of MAC address mismatches, unauthorized device connections, and spoofing attempts
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition w-fit"
          title="Refresh Alerts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                severityFilter === s
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {s} ({alerts.filter((a) => (s === 'ALL' ? true : a.severity === s)).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by MAC, student, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading security incident feed...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] text-slate-400 text-xs">
            No security alerts matching the current filter.
          </div>
        ) : (
          filtered.map((alt) => (
            <div
              key={alt.log_id}
              className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-[#150b1c] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {alt.event_type.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={alt.severity} size="sm" />
                    <StatusBadge status={alt.decision} size="sm" />
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
                    {alt.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                    <span>
                      Student: <strong className="text-slate-800 dark:text-slate-200">{alt.student_name} ({alt.student_id})</strong>
                    </span>
                    <span>
                      Observed: <strong className="text-rose-400">{alt.observed_mac}</strong>
                    </span>
                    {alt.registered_mac && (
                      <span>
                        Registered: <strong className="text-sky-400">{alt.registered_mac}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:text-right flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-400 block">
                  {alt.timestamp ? new Date(alt.timestamp).toLocaleString() : ''}
                </span>
                <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mt-1">
                  Enforcement: Flow Dropped
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
