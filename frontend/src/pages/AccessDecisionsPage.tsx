import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AccessDecision } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Scale, RefreshCw, Search, CheckCircle2, XCircle } from 'lucide-react';

export const AccessDecisionsPage: React.FC = () => {
  const [decisions, setDecisions] = useState<AccessDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ALLOW' | 'DROP'>('ALL');
  const [search, setSearch] = useState('');

  const fetchDecisions = async () => {
    try {
      const data = await api.getAccessDecisions();
      setDecisions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = decisions.filter((d) => {
    const matchesFilter = filter === 'ALL' || d.decision === filter;
    const matchesSearch =
      d.observed_mac.toLowerCase().includes(search.toLowerCase()) ||
      (d.student_id && d.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (d.student_name && d.student_name.toLowerCase().includes(search.toLowerCase())) ||
      d.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Network Access Decisions Audit Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time verification log of student authentication and MAC enforcement decisions
          </p>
        </div>

        <button
          onClick={fetchDecisions}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition w-fit"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c152d] border border-slate-200 dark:border-[#1e3160] rounded-xl p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          {(['ALL', 'ALLOW', 'DROP'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {f} ({decisions.filter((d) => (f === 'ALL' ? true : d.decision === f)).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MAC, Student or Reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-[#1e3160] bg-slate-50 dark:bg-[#0f1c3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Decisions Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold">Student Identity</th>
                <th className="py-3 px-4 font-semibold">Observed MAC</th>
                <th className="py-3 px-4 font-semibold">Client IP</th>
                <th className="py-3 px-4 font-semibold">Policy Evaluation Rationale</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading access decisions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No access decisions found.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.decision_id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50 ${
                      d.decision === 'DROP' ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        {d.decision === 'ALLOW' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <StatusBadge status={d.decision} size="sm" />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {d.student_name}
                      </div>
                      <div className="text-[11px] font-mono text-sky-400">
                        {d.student_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {d.observed_mac}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {d.ip_address || '10.0.0.101'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                      {d.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] font-mono text-slate-400">
                      {d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}
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
