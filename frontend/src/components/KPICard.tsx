import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  variant?: 'blue' | 'cyan' | 'rose' | 'amber' | 'emerald' | 'purple';
  trend?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'blue',
  trend,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'cyan':
        return {
          iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          accent: 'hover:border-cyan-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          accent: 'hover:border-rose-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          accent: 'hover:border-amber-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          accent: 'hover:border-emerald-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        };
      case 'purple':
        return {
          iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          accent: 'hover:border-indigo-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
        };
      default:
        return {
          iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          accent: 'hover:border-sky-500/50',
          glow: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`group relative rounded-xl border border-slate-200 dark:border-[#1e3160] bg-white dark:bg-[#0f1c3b] p-5 transition-all duration-300 ${colors.accent} ${colors.glow} shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colors.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-emerald-400 mr-1.5">{trend}</span>
          <span>vs previous 24h</span>
        </div>
      )}
    </div>
  );
};
