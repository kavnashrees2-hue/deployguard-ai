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
  ShieldCheck,
  ShieldAlert,
  Flame,
  Zap,
  ArrowRight,
  Database,
  Dices,
  Layers,
  Activity,
  RotateCcw
} from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import FailureCategories from '@/components/dashboard/FailureCategories';
import RecentDeployments from '@/components/dashboard/RecentDeployments';
import DeploymentDetailModal from '@/components/deployments/DeploymentDetailModal';
import { Deployment, SystemMetrics } from '@/lib/types';
import { SAMPLE_PROFILES } from '@/lib/db/dynamicProfiles';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [activeProfile, setActiveProfile] = useState<string>('default');
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const ts = Date.now();
      const [metricsRes, depsRes] = await Promise.all([
        fetch(`/api/metrics?t=${ts}`, { cache: 'no-store' }),
        fetch(`/api/deployments?t=${ts}`, { cache: 'no-store' })
      ]);

      const metricsJson = await metricsRes.json();
      const depsJson = await depsRes.json();

      if (metricsJson.success) setMetrics(metricsJson.data);
      if (depsJson.success) setDeployments(depsJson.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchDashboardData();
    setLoading(false);
  };

  const handleSwitchFleet = async (profileId: string) => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile: profileId === 'default' ? 'default' : profileId,
          action: profileId === 'default' ? 'reset' : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        const effectiveProfile = data.profile || profileId;
        setActiveProfile(effectiveProfile);
        const name = data.profileName || SAMPLE_PROFILES.find((p) => p.id === effectiveProfile)?.name || effectiveProfile;
        setSeedNotice(`Loaded: ${name}`);
        await fetchDashboardData();
        setTimeout(() => setSeedNotice(null), 3500);
      }
    } catch (err) {
      console.error('Fleet switch error:', err);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchDashboardData().then(() => setLoading(false));

    const onSeedEvent = (e: any) => {
      if (e.detail?.profile) {
        setActiveProfile(e.detail.profile);
      }
      fetchDashboardData();
    };

    window.addEventListener('deployguard:seed', onSeedEvent);
    return () => {
      window.removeEventListener('deployguard:seed', onSeedEvent);
    };
  }, []);

  return (
    <div className="space-y-8 pb-12">
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

            {/* Quick Hero Nav Buttons */}
            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
              <Link
                href="/preflight"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
              >
                <ShieldAlert className="w-4 h-4 text-white" />
                <span>Risk Gatekeeper</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/20 text-white uppercase">
                  New
                </span>
              </Link>

              <Link
                href="/chaos"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all border border-rose-400/30"
              >
                <Flame className="w-4 h-4 text-white animate-pulse" />
                <span>Chaos Studio</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/20 text-white uppercase">
                  New
                </span>
              </Link>

              <Link
                href="/analyzer"
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center gap-2 transition-all"
              >
                <SearchCode className="w-4 h-4 text-cyan-400" />
                <span>Log Analyzer</span>
              </Link>

              <Link
                href="/pipeline"
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center gap-2 transition-all"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Pipeline</span>
              </Link>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all cursor-pointer"
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

      {/* Standout Features Showcase Banner (New in DeployGuard) */}
      <div className="p-6 rounded-2xl bg-[#0b101d] border border-indigo-500/30 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Standout Features in DeployGuard AI
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              Added Today
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Explore the newest SRE & resilience tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Feature 1 Card: Pre-Flight AI Risk Gatekeeper */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-400/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Shift-Left SRE
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Pre-Deployment AI Risk Gatekeeper
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Evaluate PRs, git diffs, and schema migrations before rollout. Detects destructive DB locks, pod memory starvation, and hardcoded port bindings.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-mono">✓ 5 Architecture Checks</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono">Blast Radius Mapping</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Route: <code className="text-indigo-300 font-mono">/preflight</code></span>
              <Link
                href="/preflight"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
              >
                <span>Launch Gatekeeper</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Feature 2 Card: Chaos Engineering & Microservice Resilience */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-400/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300">
                  <Flame className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Live Sandbox
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                Chaos Engineering & Resilience Studio
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Inject real-world distributed faults into a 6-node production microservice mesh. Watch autonomous self-healing scale pods and recycle poisoned connections.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="text-rose-400 font-mono">⚡ 5 Injected Faults</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">Autonomous Self-Healing</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Route: <code className="text-rose-300 font-mono">/chaos</code></span>
              <Link
                href="/chaos"
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
              >
                <span>Open Chaos Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sample Dataset Switcher Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1424] to-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Dynamic Sample Fleet Controller</span>
              {seedNotice ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                  {seedNotice}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">
                  Current: <strong className="text-indigo-300">{SAMPLE_PROFILES.find((p) => p.id === activeProfile)?.name || activeProfile}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate different microservice failure scenarios dynamically or reset to baseline with one click:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Change / Next Sample Button */}
          <button
            onClick={() => handleSwitchFleet('next')}
            disabled={seeding}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Cycle to next dynamic failure fleet"
          >
            <Dices className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Switching...' : 'Change Sample Fleet'}</span>
          </button>

          {/* Reset Baseline Button */}
          <button
            onClick={() => handleSwitchFleet('default')}
            disabled={seeding}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset database to initial baseline sample"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>

          {/* Preset Chips */}
          <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-800">
            {SAMPLE_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwitchFleet(p.id)}
                disabled={seeding}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                  activeProfile === p.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
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
                <strong>Closed-Loop Auto-Remediation:</strong> Every failed deployment and incident features a live self-healing runner that applies dynamic patches and validates HTTP 200 health probes.
              </p>
              <p>
                <strong>AI Pre-Flight Gatekeeper:</strong> Analyzes git diffs, schema locks, and resource allocations before code reaches production clusters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDeployment && (
        <DeploymentDetailModal
          deployment={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
          onRollbackComplete={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
