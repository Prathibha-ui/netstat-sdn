import React, { useState } from 'react';
import { TopologyNode, TopologyLink } from '../types';
import { Cpu, Server, Router, Laptop, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface TopologyGraphProps {
  nodes: TopologyNode[];
  links: TopologyLink[];
  isLive: boolean;
  statusInfo?: any;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ nodes, links, isLive, statusInfo }) => {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  // Layout positions for nodes
  const nodePositions: Record<string, { x: number; y: number }> = {
    c0: { x: 350, y: 50 },        // Ryu Controller at top center
    s1: { x: 350, y: 190 },       // Open vSwitch in middle center
    gw: { x: 620, y: 190 },       // Gateway to right of switch
    host_unauthorized_demo: { x: 550, y: 340 }, // Rogue host bottom right
  };

  // Dynamically position student hosts across bottom
  const studentNodes = nodes.filter(
    (n) => n.type === 'host_allowed' || (n.id.startsWith('host_') && n.id !== 'host_unauthorized_demo')
  );

  studentNodes.forEach((n, idx) => {
    const spacing = 140;
    const startX = 120;
    nodePositions[n.id] = { x: startX + idx * spacing, y: 340 };
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'controller':
        return <Cpu className="w-6 h-6 text-cyan-400" />;
      case 'switch':
        return <Server className="w-6 h-6 text-sky-400" />;
      case 'gateway':
        return <Router className="w-6 h-6 text-emerald-400" />;
      case 'host_blocked':
        return <ShieldAlert className="w-6 h-6 text-rose-400" />;
      default:
        return <Laptop className="w-6 h-6 text-sky-300" />;
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0c152d] p-6 shadow-sm overflow-hidden">
      {/* Topology Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1e3160] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              SDN Network Topology Visualization
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isLive
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {isLive ? 'Live OpenFlow Switch' : 'Simulation Topology (Active)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive map of Ryu Controller, Open vSwitch, Gateway, and Student Host access links
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span>
            <span>Permitted Flow</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-rose-400 inline-block"></span>
            <span>Blocked Flow</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed inline-block"></span>
            <span>OpenFlow 1.3 Control</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[400px] my-2 bg-slate-50/50 dark:bg-[#070d1e]/80 rounded-xl overflow-hidden border border-slate-100 dark:border-[#14244a]">
        <svg className="w-full h-full" viewBox="0 0 750 400">
          <defs>
            <linearGradient id="linkAllowed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="linkBlocked" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="linkControl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Links */}
          {links.map((link) => {
            const p1 = nodePositions[link.source] || { x: 100, y: 100 };
            const p2 = nodePositions[link.target] || { x: 350, y: 190 };
            const isBlocked = link.status === 'DROPPED';
            const isControl = link.type === 'control';

            return (
              <g key={link.id}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={
                    isBlocked
                      ? '#f43f5e'
                      : isControl
                      ? '#22d3ee'
                      : '#38bdf8'
                  }
                  strokeWidth={isControl ? 2.5 : 2}
                  strokeDasharray={isControl ? '6 4' : undefined}
                  className="transition-all"
                  opacity={0.8}
                />
                {/* Port label if any */}
                {link.port && (
                  <text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 - 6}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {link.port}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 150, y: 150 };
            const isSelected = selectedNode?.id === node.id;
            const isBlocked = node.type === 'host_blocked';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Outer halo */}
                <circle
                  r={isSelected ? 28 : 24}
                  className={`transition-all duration-300 ${
                    isBlocked
                      ? 'fill-rose-500/20 stroke-rose-500/60'
                      : node.type === 'controller'
                      ? 'fill-cyan-500/20 stroke-cyan-500/60'
                      : node.type === 'switch'
                      ? 'fill-sky-500/20 stroke-sky-500/60'
                      : 'fill-slate-800/80 stroke-sky-500/40'
                  }`}
                  strokeWidth={isSelected ? 3 : 1.5}
                />

                {/* Center dot/icon container */}
                <circle
                  r="16"
                  className={
                    isBlocked
                      ? 'fill-[#1a0a14]'
                      : node.type === 'controller'
                      ? 'fill-[#051c2c]'
                      : 'fill-[#0c152d]'
                  }
                />

                {/* Node Label */}
                <text
                  y="40"
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-slate-200 text-[11px] font-bold"
                >
                  {node.label}
                </text>
                <text
                  y="52"
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
                >
                  {node.ip || (node.mac ? node.mac.substring(0, 11) + '..' : '')}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-3 text-[11px] text-slate-400 bg-white/80 dark:bg-[#0c152d]/90 px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#1e3160] backdrop-blur-sm">
          💡 Click any node on the graph to inspect OpenFlow ports, MAC, and flow telemetry
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-[#0f1c3b] animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30">
                {getNodeIcon(selectedNode.type)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedNode.label}</span>
                  <StatusBadge status={selectedNode.status} size="sm" />
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedNode.description || 'SDN Network Infrastructure Node'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {selectedNode.ip && (
              <div className="p-2 rounded bg-slate-100 dark:bg-[#14244a] border border-slate-200 dark:border-[#1e3160]">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">IP Address</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.ip}</span>
              </div>
            )}
            {selectedNode.mac && (
              <div className="p-2 rounded bg-slate-100 dark:bg-[#14244a] border border-slate-200 dark:border-[#1e3160]">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">MAC Address</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.mac}</span>
              </div>
            )}
            {selectedNode.dpid && (
              <div className="p-2 rounded bg-slate-100 dark:bg-[#14244a] border border-slate-200 dark:border-[#1e3160]">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Switch DPID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.dpid}</span>
              </div>
            )}
            {selectedNode.port && (
              <div className="p-2 rounded bg-slate-100 dark:bg-[#14244a] border border-slate-200 dark:border-[#1e3160]">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Attached Switch Port</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.port}</span>
              </div>
            )}
            {selectedNode.openflow_version && (
              <div className="p-2 rounded bg-slate-100 dark:bg-[#14244a] border border-slate-200 dark:border-[#1e3160]">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">SDN Protocol</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedNode.openflow_version}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
