import React from 'react';
import Link from 'next/link';
import { Deployment } from '@/lib/types';
import { getStatusBadge, getEnvironmentBadge, formatDuration } from '@/lib/utils';
import { GitCommit, ArrowRight, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecentDeploymentsProps {
  deployments: Deployment[];
  onSelectDeployment?: (deployment: Deployment) => void;
}

export default function RecentDeployments({ deployments, onSelectDeployment }: RecentDeploymentsProps) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Deployments Stream</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status of microservices in the deployment pipeline</p>
        </div>
        <Link
          href="/deployments"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {deployments.slice(0, 5).map((dep) => {
          const status = getStatusBadge(dep.status);
          const env = getEnvironmentBadge(dep.environment);

          return (
            <div
              key={dep.id}
              onClick={() => onSelectDeployment && onSelectDeployment(dep)}
              className="p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 hover:border-slate-600 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 w-8 h-8 rounded-lg ${status.bg} border ${status.border} flex items-center justify-center shrink-0`}>
                  {dep.status === 'SUCCESS' ? (
                    <CheckCircle2 className={`w-4 h-4 ${status.text}`} />
                  ) : dep.status === 'FAILED' ? (
                    <AlertCircle className={`w-4 h-4 ${status.text}`} />
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-full ${dep.status === 'IN_PROGRESS' ? 'bg-cyan-400 animate-beacon' : 'bg-amber-400'}`} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-tight">{dep.serviceName}</span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60">
                      {dep.version}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${env.bg} ${env.text} ${env.border}`}>
                      {dep.environment}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 truncate max-w-md">
                    {dep.commitMessage}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <GitCommit className="w-3 h-3 text-slate-400" />
                      {dep.commitHash}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {dep.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDuration(dep.durationSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border} flex items-center gap-1.5`}>
                  {status.pulse && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-beacon" />}
                  {status.label}
                </span>

                {dep.status === 'FAILED' && (
                  <Link
                    href={`/analyzer?service=${encodeURIComponent(dep.serviceName)}&log=${encodeURIComponent(dep.rawLogs)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
                  >
                    Triage Error
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
