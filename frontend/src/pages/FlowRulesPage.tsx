import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NetworkFlowRule } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PacketSimulatorModal } from '../components/PacketSimulatorModal';
import { Layers, RefreshCw, Send, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export const FlowRulesPage: React.FC = () => {
  const [flows, setFlows] = useState<NetworkFlowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);

  const fetchFlows = async () => {
    try {
      const data = await api.getFlowRules();
      setFlows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
    const interval = setInterval(fetchFlows, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            OpenFlow 1.3 Flow Table (Switch s1)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pipeline flow rules programmed by the NETSTAT SDN Controller
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchFlows}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition"
            title="Refresh Flow Rules"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPacketModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Ingress Packet</span>
          </button>
        </div>
      </div>

      {/* Architecture Explainer Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-[#1a0a14] text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Priority 200: DROP Unauthorized MAC</span>
          </div>
          <p className="text-slate-400">
            Installs empty actions pipeline for rogue/secondary devices. Packets dropped in hardware/kernel at switch port.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-[#0c1e3d] text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-sky-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Priority 100: ALLOW Verified Device</span>
          </div>
          <p className="text-slate-400">
            Forwarding instruction matches verified registered MAC address and outputs directly to Gateway uplink.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 dark:bg-[#081a2e] text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-cyan-400">
            <Cpu className="w-4 h-4" />
            <span>Priority 0: Table-Miss Packet-In</span>
          </div>
          <p className="text-slate-400">
            Unrecognized incoming packets generate an OpenFlow Packet-In event to Ryu Controller for policy inspection.
          </p>
        </div>
      </div>

      {/* Flow Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-3 px-3 font-semibold">Priority</th>
                <th className="py-3 px-3 font-semibold">Table</th>
                <th className="py-3 px-4 font-semibold">Match Fields</th>
                <th className="py-3 px-4 font-semibold">Instructions / Actions</th>
                <th className="py-3 px-3 font-semibold">Rule Type</th>
                <th className="py-3 px-3 font-semibold text-right">Packets</th>
                <th className="py-3 px-3 font-semibold text-right">Bytes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading OpenFlow flow entries...
                  </td>
                </tr>
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active flow entries in switch flow table.
                  </td>
                </tr>
              ) : (
                flows.map((flow) => {
                  const isDrop = flow.actions.includes('DROP') || flow.rule_type === 'DROP_UNAUTHORIZED';
                  return (
                    <tr
                      key={flow.rule_id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50 ${
                        isDrop ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            flow.priority >= 200
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : flow.priority >= 100
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {flow.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        Table {flow.table_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                        {flow.match}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={
                            isDrop
                              ? 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded'
                              : 'text-emerald-400'
                          }
                        >
                          {flow.actions}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={flow.rule_type} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-slate-700 dark:text-slate-300">
                        {flow.packet_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-slate-500 dark:text-slate-400">
                        {flow.byte_count.toLocaleString()} B
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PacketSimulatorModal
        isOpen={isPacketModalOpen}
        onClose={() => setIsPacketModalOpen(false)}
      />
    </div>
  );
};
