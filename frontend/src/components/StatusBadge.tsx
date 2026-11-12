import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  const getStyle = () => {
    switch (norm) {
      case 'ALLOWED':
      case 'ALLOW':
      case 'AUTHORIZED':
      case 'ONLINE':
      case 'ACTIVE':
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'BLOCKED':
      case 'BLOCK':
      case 'DROP':
      case 'DROPPED':
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'REVOKED':
      case 'MEDIUM':
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'EMULATED':
      case 'SIMULATION_MODE':
      case 'SIMULATED':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${px} ${getStyle()} tracking-wide`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {norm}
    </span>
  );
};
