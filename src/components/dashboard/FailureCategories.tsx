import React from 'react';
import { FailureCategory } from '@/lib/types';
import { getCategoryBadge } from '@/lib/utils';
import { Server, Database, Globe, Wrench, Package, ShieldAlert, Code } from 'lucide-react';

interface FailureCategoriesProps {
  breakdown: Record<FailureCategory, number>;
}

export default function FailureCategories({ breakdown }: FailureCategoriesProps) {
  const total = Object.values(breakdown).reduce((acc, curr) => acc + curr, 0) || 1;

  const categoryIcons: Record<FailureCategory, React.ReactNode> = {
    INFRASTRUCTURE: <Server className="w-3.5 h-3.5" />,
    DATABASE: <Database className="w-3.5 h-3.5" />,
    NETWORK: <Globe className="w-3.5 h-3.5" />,
    CONFIGURATION: <Wrench className="w-3.5 h-3.5" />,
    DEPENDENCY: <Package className="w-3.5 h-3.5" />,
    SECURITY: <ShieldAlert className="w-3.5 h-3.5" />,
    APPLICATION: <Code className="w-3.5 h-3.5" />
  };

  const categories = (Object.keys(breakdown) as FailureCategory[])
    .map((cat) => ({
      category: cat,
      count: breakdown[cat],
      percent: Math.round((breakdown[cat] / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Failure Root-Cause Taxonomy</h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated categorization of detected deployment failures</p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
          Total: {total}
        </span>
      </div>

      <div className="space-y-4">
        {categories.map(({ category, count, percent }) => {
          const badge = getCategoryBadge(category);
          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-2 font-medium ${badge.text}`}>
                  {categoryIcons[category]}
                  <span>{badge.label}</span>
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-300 font-bold">{count}</span>
                  <span className="text-slate-400 text-[11px]">({percent}%)</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    category === 'INFRASTRUCTURE' ? 'bg-cyan-500' :
                    category === 'DATABASE' ? 'bg-indigo-500' :
                    category === 'NETWORK' ? 'bg-sky-500' :
                    category === 'CONFIGURATION' ? 'bg-amber-500' :
                    category === 'DEPENDENCY' ? 'bg-purple-500' :
                    category === 'SECURITY' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
