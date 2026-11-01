import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo'
}: StatCardProps) {
  const colorMap = {
    indigo: {
      border: 'border-indigo-500/20',
      bgIcon: 'bg-indigo-500/10 text-indigo-400',
      glow: 'shadow-indigo-500/5'
    },
    emerald: {
      border: 'border-emerald-500/20',
      bgIcon: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-500/5'
    },
    rose: {
      border: 'border-rose-500/20',
      bgIcon: 'bg-rose-500/10 text-rose-400',
      glow: 'shadow-rose-500/5'
    },
    amber: {
      border: 'border-amber-500/20',
      bgIcon: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-500/5'
    },
    cyan: {
      border: 'border-cyan-500/20',
      bgIcon: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-cyan-500/5'
    }
  };

  const scheme = colorMap[accentColor];

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/60 border ${scheme.border} backdrop-blur-md shadow-xl ${scheme.glow} relative overflow-hidden transition-all hover:translate-y-[-2px] hover:border-slate-700`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${scheme.bgIcon} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
