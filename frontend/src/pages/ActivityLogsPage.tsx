import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SecurityLog } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ScrollText, RefreshCw, Search } from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.getSecurityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.observed_mac.toLowerCase().includes(search.toLowerCase()) ||
      (l.student_id && l.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (l.student_name && l.student_name.toLowerCase().includes(search.toLowerCase())) ||
      l.reason.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            System & Security Activity Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive audit timeline of device registrations, admin actions, and policy decisions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition w-fit"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by MAC, Student, Event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
          {logs.length} Total Events Logged
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-3 px-4 font-semibold">Event Type</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Observed MAC</th>
                <th className="py-3 px-4 font-semibold">Reason / Description</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading activity logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.log_id} className="hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {l.event_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={l.decision} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {l.student_name}
                      </span>
                      <span className="block text-[11px] font-mono text-sky-400">
                        {l.student_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {l.observed_mac}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      {l.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
