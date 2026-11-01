'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  GitCommit, 
  User, 
  SearchCode,
  Play
} from 'lucide-react';
import { Deployment } from '@/lib/types';
import { getStatusBadge, getEnvironmentBadge, formatDate, formatDuration } from '@/lib/utils';
import DeploymentDetailModal from '@/components/deployments/DeploymentDetailModal';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEnv !== 'all') params.append('environment', selectedEnv);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/deployments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDeployments(data.data);
      }
    } catch (err) {
      console.error('Failed to load deployments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (selectedEnv !== 'all') params.append('environment', selectedEnv);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);

        const res = await fetch(`/api/deployments?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setDeployments(data.data);
        }
      } catch (err) {
        console.error('Failed to load deployments:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [selectedEnv, selectedStatus]);

  const filtered = deployments.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.serviceName.toLowerCase().includes(q) ||
      d.commitHash.toLowerCase().includes(q) ||
      d.author.toLowerCase().includes(q) ||
      d.commitMessage.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Deployments</h1>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {filtered.length} total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end monitoring and deployment telemetry across all clusters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pipeline"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Launch Pipeline Simulator</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by service, commit, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Environment */}
          <div className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 text-xs">
            {['all', 'production', 'staging', 'development'].map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-medium ${
                  selectedEnv === env
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60 text-xs">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'SUCCESS', label: 'Healthy' },
              { id: 'FAILED', label: 'Failed' },
              { id: 'ROLLED_BACK', label: 'Rolled Back' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  selectedStatus === st.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading deployments stream...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <p className="text-sm font-semibold text-slate-300">No deployments match the selected filters</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the environment or status filter.</p>
          </div>
        ) : (
          filtered.map((dep) => {
            const status = getStatusBadge(dep.status);
            const env = getEnvironmentBadge(dep.environment);

            return (
              <div
                key={dep.id}
                onClick={() => setSelectedDeployment(dep)}
                className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 backdrop-blur-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg hover:shadow-xl hover:translate-y-[-1px]"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`mt-1 w-10 h-10 rounded-xl ${status.bg} border ${status.border} flex items-center justify-center shrink-0`}>
                    {dep.status === 'SUCCESS' ? (
                      <CheckCircle2 className={`w-5 h-5 ${status.text}`} />
                    ) : dep.status === 'FAILED' ? (
                      <AlertCircle className={`w-5 h-5 ${status.text}`} />
                    ) : (
                      <span className={`w-3 h-3 rounded-full ${dep.status === 'IN_PROGRESS' ? 'bg-cyan-400 animate-beacon' : 'bg-amber-400'}`} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white tracking-tight">{dep.serviceName}</span>
                      <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                        {dep.version}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${env.bg} ${env.text} ${env.border}`}>
                        {dep.environment}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-1 max-w-xl">
                      {dep.commitMessage}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                        {dep.commitHash}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {dep.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(dep.startedAt)} ({formatDuration(dep.durationSeconds)})
                      </span>
                      <span className="text-slate-400">Trigger: {dep.trigger}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${status.bg} ${status.text} ${status.border} flex items-center gap-1.5`}>
                    {status.pulse && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-beacon" />}
                    {status.label}
                  </span>

                  {dep.status === 'FAILED' && (
                    <Link
                      href={`/analyzer?service=${encodeURIComponent(dep.serviceName)}&log=${encodeURIComponent(dep.rawLogs)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1.5"
                    >
                      <SearchCode className="w-3.5 h-3.5" />
                      <span>Diagnose</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Modal */}
      <DeploymentDetailModal
        deployment={selectedDeployment}
        onClose={() => setSelectedDeployment(null)}
        onRollbackComplete={() => {
          fetchDeployments();
        }}
      />
    </div>
  );
}
