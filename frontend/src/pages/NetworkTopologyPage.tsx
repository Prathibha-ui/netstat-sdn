import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NetworkTopologyData } from '../types';
import { TopologyGraph } from '../components/TopologyGraph';
import { StatusBadge } from '../components/StatusBadge';
import { PacketSimulatorModal } from '../components/PacketSimulatorModal';
import { Network, Server, Router, Cpu, ShieldCheck, Send, RefreshCw } from 'lucide-react';

export const NetworkTopologyPage: React.FC = () => {
  const [data, setData] = useState<NetworkTopologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPacketModalOpen, setIsPacketModalOpen] = useState(false);

  const fetchTopology = async () => {
    try {
      const top = await api.getTopology();
      setData(top);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">Loading SDN Topology...</span>
        </div>
      </div>
    );
  }

  const ports = [
    { port: 'Port 1 (s1-eth1)', connectedTo: 'Hostel Gateway Router (10.0.0.1)', status: 'FORWARDING', type: 'Uplink (1 Gbps)', flow: 'Default Gateway' },
    { port: 'Port 2 (s1-eth2)', connectedTo: 'Student 23CS001 (Aarav Sharma)', status: 'FORWARDING', type: 'Access (Trusted)', flow: 'Priority 100 ALLOW' },
    { port: 'Port 3 (s1-eth3)', connectedTo: 'Student 23CS002 (Sneha Patel)', status: 'FORWARDING', type: 'Access (Trusted)', flow: 'Priority 100 ALLOW' },
    { port: 'Port 4 (s1-eth4)', connectedTo: 'Unauthorized 2nd Device (Rogue)', status: 'DROPPED', type: 'Access (Blocked)', flow: 'Priority 200 DROP' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Software-Defined Network Topology
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive visualization of OpenFlow 1.3 switch ports and attached client hosts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTopology}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#1e3160] hover:bg-slate-100 dark:hover:bg-[#14244a] text-slate-400 hover:text-white transition"
            title="Refresh Topology"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPacketModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Ingress Frame</span>
          </button>
        </div>
      </div>

      {/* Main Interactive SVG Graph */}
      {data && (
        <TopologyGraph
          nodes={data.nodes}
          links={data.links}
          isLive={data.is_live}
          statusInfo={data.status}
        />
      )}

      {/* Switch Port Mapping Table */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Open vSwitch s1 - Physical Port Mapping & Enforcement
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Status of physical interfaces attached to datapath 0000000000000001
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0c152d] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e3160]">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Switch Port</th>
                <th className="py-2.5 px-3 font-semibold">Connected Endpoint</th>
                <th className="py-2.5 px-3 font-semibold">Link Type</th>
                <th className="py-2.5 px-3 font-semibold">Enforcement Policy</th>
                <th className="py-2.5 px-3 font-semibold">Port Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3160]">
              {ports.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#14244a]/50">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{p.port}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{p.connectedTo}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{p.type}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-sky-400">{p.flow}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                </tr>
              ))}
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
