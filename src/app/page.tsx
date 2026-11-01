'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Rocket, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  SearchCode, 
  Sparkles, 
  RefreshCw,
  Server,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import FailureCategories from '@/components/dashboard/FailureCategories';
import RecentDeployments from '@/components/dashboard/RecentDeployments';
import DeploymentDetailModal from '@/components/deployments/DeploymentDetailModal';
import { Deployment, SystemMetrics } from '@/lib/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [metricsRes, depsRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/deployments')
      ]);

      const metricsJson = await metricsRes.json();
      const depsJson = await depsRes.json();

      if (metricsJson.success) setMetrics(metricsJson.data);
      if (depsJson.success) setDeployments(depsJson.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [metricsRes, depsRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/deployments')
        ]);

        const metricsJson = await metricsRes.json();
        const depsJson = await depsRes.json();

        if (!ignore) {
          if (metricsJson.success) setMetrics(metricsJson.data);
          if (depsJson.success) setDeployments(depsJson.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Quick Presentation Banner */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950/90 border border-indigo-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                DevOps & SRE Autonomous Triage System
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Demo Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              DeployGuard AI
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Detect deployment failures across microservices, dissect Kubernetes & CI/CD error logs with a deterministic rule-based analysis engine, pinpoint probable root causes, and execute verified remediation runbooks.
            </p>

            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <Link
                href="/analyzer"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <SearchCode className="w-4 h-4" />
                <span>Launch Log Analyzer</span>
              </Link>

              <Link
                href="/pipeline"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center gap-2 transition-all"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Pipeline Visualizer</span>
              </Link>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Health Meter Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 lg:w-72 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Deployment Health
              </span>
              <span className="font-mono text-emerald-400 text-sm font-bold">
                {metrics ? `${metrics.successRate}%` : '—'}
              </span>
            </div>

            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-700"
                style={{ width: `${metrics?.successRate || 75}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800">
              <span>Failed: <strong className="text-rose-400">{metrics?.failedDeployments || 0}</strong></span>
              <span>Active Incidents: <strong className="text-amber-400">{metrics?.activeIncidents || 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Deployments"
          value={metrics ? metrics.totalDeployments : '—'}
          subtitle="Tracked across all environments"
          icon={Rocket}
          trend={{ value: '+14% this week', isPositive: true }}
          accentColor="indigo"
        />
        <StatCard
          title="Success Rate"
          value={metrics ? `${metrics.successRate}%` : '—'}
          subtitle="Target SLA: > 85%"
          icon={CheckCircle2}
          trend={{ value: '+4.2% vs last cycle', isPositive: true }}
          accentColor="emerald"
        />
        <StatCard
          title="Active Incidents"
          value={metrics ? metrics.activeIncidents : '—'}
          subtitle="Critical triage required"
          icon={AlertTriangle}
          trend={metrics?.activeIncidents && metrics.activeIncidents > 0 ? { value: 'Requires Action', isPositive: false } : undefined}
          accentColor="rose"
        />
        <StatCard
          title="Mean Time To Recover"
          value={metrics ? `${metrics.meanTimeToRecoveryMinutes}m` : '—'}
          subtitle="Average diagnostic to rollback time"
          icon={Clock}
          trend={{ value: '-8m with DeployGuard', isPositive: true }}
          accentColor="cyan"
        />
      </div>

      {/* Main Grid: Failure Root-Cause Taxonomy & Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Deployments Feed (7 cols) */}
        <div className="lg:col-span-7">
          <RecentDeployments 
            deployments={deployments} 
            onSelectDeployment={(dep) => setSelectedDeployment(dep)} 
          />
        </div>

        {/* Failure Categories & Architecture Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {metrics && <FailureCategories breakdown={metrics.categoryBreakdown} />}

          {/* Architecture Highlights Pill */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              DeployGuard Core Architecture
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p>
                <strong>Rule Engine:</strong> Heuristic multi-line regex pattern matcher with dynamic confidence weighting. Evaluates Kubernetes, database, network, and dependency crash traces completely offline.
              </p>
              <p>
                <strong>Database Sync:</strong> MongoDB persistence layer with instant zero-setup memory fallback for local execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Modal Drawer */}
      <DeploymentDetailModal
        deployment={selectedDeployment}
        onClose={() => setSelectedDeployment(null)}
        onRollbackComplete={() => {
          handleRefresh();
        }}
      />
    </div>
  );
}
