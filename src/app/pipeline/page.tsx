'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  SearchCode, 
  Layers, 
  Sparkles,
  RotateCcw,
  Zap,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface VisualStage {
  id: string;
  name: string;
  description: string;
  iconName: 'code' | 'test' | 'docker' | 'security' | 'database' | 'rollout' | 'health';
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs?: number;
  errorLog?: string;
}

const DEFAULT_STAGES: VisualStage[] = [
  { id: 'stg-1', name: 'Code Checkout & Lint', description: 'Git SHA verification and ESLint', iconName: 'code', status: 'PENDING' },
  { id: 'stg-2', name: 'Automated Test Suite', description: 'Unit & integration tests execution', iconName: 'test', status: 'PENDING' },
  { id: 'stg-3', name: 'Container Build & Push', description: 'Multi-stage Dockerfile build to registry', iconName: 'docker', status: 'PENDING' },
  { id: 'stg-4', name: 'Vulnerability CVE Scan', description: 'Trivy container security audit', iconName: 'security', status: 'PENDING' },
  { id: 'stg-5', name: 'Database Schema Migration', description: 'Prisma / Flyway DDL execution', iconName: 'database', status: 'PENDING' },
  { id: 'stg-6', name: 'Canary Kubernetes Rollout', description: 'Deploy 10% traffic canary pod', iconName: 'rollout', status: 'PENDING' },
  { id: 'stg-7', name: 'Healthcheck Verification', description: 'Liveness probe and synthetic traffic check', iconName: 'health', status: 'PENDING' }
];

export default function PipelinePage() {
  const [stages, setStages] = useState<VisualStage[]>(DEFAULT_STAGES);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('oom_crash');
  const [activeLog, setActiveLog] = useState<string | null>(null);
  const [failedStageLog, setFailedStageLog] = useState<string | null>(null);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [healedInfo, setHealedInfo] = useState<{ fixName: string; service: string } | null>(null);

  const handleResetPipeline = () => {
    setIsRunning(false);
    setIsHealing(false);
    setHealedInfo(null);
    setStages(DEFAULT_STAGES.map((s) => ({ ...s, status: 'PENDING', durationMs: undefined, errorLog: undefined })));
    setActiveLog(null);
    setFailedStageLog(null);
  };

  const handleAutoHealPipeline = async () => {
    if (isRunning || isHealing) return;
    setIsHealing(true);
    setFailedStageLog(null);

    const fixMap: Record<string, string> = {
      oom_crash: 'Patched Kubernetes Pod Spec: Memory Limit increased 512Mi -> 1.5Gi (resources.limits.memory)',
      db_lock: 'Killed blocking PID & Released Postgres Advisory Lock on schema_migrations table',
      port_conflict: 'Terminated ghost process on port 8080 & Re-bound container to 0.0.0.0:8081',
      healthy: 'Optimal configuration verified'
    };

    const fixApplied = fixMap[selectedScenario] || 'Dynamic Auto-Healing Patch Applied';
    setActiveLog(`[DEPLOYGUARD AUTO-HEAL] Executing automated runbook: ${fixApplied}...`);

    const current = [...stages];
    const failedIndex = current.findIndex((s) => s.status === 'FAILED');

    if (failedIndex !== -1) {
      current[failedIndex].status = 'RUNNING';
      current[failedIndex].name = `${current[failedIndex].name} (Healing...)`;
      setStages([...current]);
      await new Promise((resolve) => setTimeout(resolve, 800));

      current[failedIndex].status = 'PASSED';
      current[failedIndex].name = current[failedIndex].name.replace(' (Healing...)', ' [Auto-Healed]');
      current[failedIndex].errorLog = undefined;
      current[failedIndex].durationMs = 1800;
      setStages([...current]);

      // Sequentially advance any remaining stages that were skipped
      for (let j = failedIndex + 1; j < current.length; j++) {
        current[j].status = 'RUNNING';
        setStages([...current]);
        setActiveLog(`[AUTO-HEAL PROGRESS] Executing Stage ${j + 1}/${current.length}: ${current[j].name}...`);
        await new Promise((resolve) => setTimeout(resolve, 600));

        current[j].status = 'PASSED';
        current[j].durationMs = Math.floor(Math.random() * 1500 + 1000);
        setStages([...current]);
      }
    }

    try {
      await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: 'billing-transaction-worker',
          scenario: selectedScenario,
          fixTitle: fixApplied
        })
      });
    } catch (e) {
      console.error(e);
    }

    setHealedInfo({ fixName: fixApplied, service: 'billing-transaction-worker' });
    setActiveLog(`🎉 Application successfully healed & running! Healthcheck verified HTTP 200 OK. 100% traffic active.`);
    setIsHealing(false);
  };

  const runPipelineSimulation = async (scenario: string) => {
    setIsRunning(true);
    setActiveLog('Initiating simulated CI/CD runner container...');
    setFailedStageLog(null);

    // Reset stages to pending
    const current: VisualStage[] = DEFAULT_STAGES.map((s) => ({ ...s, status: 'PENDING', durationMs: undefined, errorLog: undefined }));
    setStages(current);

    // Call backend API to record deployment
    try {
      fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, serviceName: 'billing-transaction-worker' })
      });
    } catch (err) {
      console.error(err);
    }

    // Sequentially advance stages
    for (let i = 0; i < current.length; i++) {
      // Mark stage RUNNING
      current[i].status = 'RUNNING';
      setStages([...current]);
      setActiveLog(`Executing Stage ${i + 1}/${current.length}: ${current[i].name}...`);

      await new Promise((resolve) => setTimeout(resolve, 600));

      // Decide if this stage fails based on scenario
      let shouldFail = false;
      let failureError = '';

      if (scenario === 'oom_crash' && i === 6) {
        shouldFail = true;
        failureError = 'Container terminated. Reason: OOMKilled, Exit Code: 137. Memory limit 512Mi exceeded.';
      } else if (scenario === 'db_lock' && i === 4) {
        shouldFail = true;
        failureError = 'Error: P3005: Database schema is locked for migrations. Timed out waiting for lock on table "schema_migrations".';
      } else if (scenario === 'port_conflict' && i === 5) {
        shouldFail = true;
        failureError = 'Error: listen EADDRINUSE: address already in use 0.0.0.0:8080';
      }

      if (shouldFail) {
        current[i].status = 'FAILED';
        current[i].durationMs = 2100;
        current[i].errorLog = failureError;
        setFailedStageLog(failureError);
        setActiveLog(`[FATAL] Stage ${current[i].name} FAILED: ${failureError}`);

        // Skip subsequent stages
        for (let j = i + 1; j < current.length; j++) {
          current[j].status = 'SKIPPED';
        }
        setStages([...current]);
        setIsRunning(false);
        return;
      } else {
        current[i].status = 'PASSED';
        current[i].durationMs = Math.floor(Math.random() * 2000 + 1000);
        setStages([...current]);
      }
    }

    setActiveLog('Pipeline completed successfully! Canary promoted to 100% production traffic.');
    setIsRunning(false);
  };

  return (
    <div className="space-y-8">
      {/* Title & Simulator Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Deployment Pipeline Visualizer</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Interactive CI/CD Simulation
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate staging & production rollout graphs, inject real failure conditions, and inspect automated triage
          </p>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedScenario}
            onChange={(e) => {
              setSelectedScenario(e.target.value);
              handleResetPipeline();
            }}
            disabled={isRunning}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
          >
            <option value="oom_crash">Inject: Kubernetes OOMKilled (Exit 137)</option>
            <option value="db_lock">Inject: Database Migration Lock</option>
            <option value="port_conflict">Inject: Port EADDRINUSE Conflict</option>
            <option value="healthy">Clean Run: 100% Passed Pipeline</option>
          </select>

          <button
            onClick={handleResetPipeline}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Reset stages to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => runPipelineSimulation(selectedScenario)}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Running Pipeline...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="p-6 lg:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Execution Stages Graph (Target: Production Kubernetes)
          </span>
          <span className="text-xs font-mono text-slate-400">
            Stages: {stages.filter((s) => s.status === 'PASSED').length}/{stages.length} Passed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 relative">
          {stages.map((stage, idx) => {
            const isPassed = stage.status === 'PASSED';
            const isFailed = stage.status === 'FAILED';
            const isRunning = stage.status === 'RUNNING';
            const isSkipped = stage.status === 'SKIPPED';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[160px] relative ${
                  isPassed
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                    : isFailed
                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 shadow-xl shadow-rose-500/10'
                    : isRunning
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-xl shadow-cyan-500/10 animate-pulse'
                    : isSkipped
                    ? 'bg-slate-900/30 border-slate-800/40 text-slate-600'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-500">Stage 0{idx + 1}</span>
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isFailed ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : isRunning ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-beacon" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-white tracking-tight mt-1">{stage.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {stage.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className={`font-semibold ${
                    isPassed ? 'text-emerald-400' : isFailed ? 'text-rose-400' : isRunning ? 'text-cyan-400' : 'text-slate-500'
                  }`}>
                    {stage.status}
                  </span>
                  <span className="text-slate-400">
                    {stage.durationMs ? `${(stage.durationMs / 1000).toFixed(1)}s` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Failure Detected Banner inside Visualizer */}
        {failedStageLog && (
          <div className="mt-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-200">Deployment Pipeline Halted</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Failed Stage
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 font-mono mt-1">{failedStageLog}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleAutoHealPipeline}
                disabled={isHealing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 fill-white ${isHealing ? 'animate-bounce' : ''}`} />
                <span>{isHealing ? 'Applying Fix & Recovering...' : '⚡ Auto-Fix Error & Run Application'}</span>
              </button>

              <Link
                href={`/analyzer?log=${encodeURIComponent(failedStageLog)}`}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-indigo-600/30"
              >
                <SearchCode className="w-3.5 h-3.5" />
                <span>Deep Triage</span>
              </Link>

              <button
                onClick={handleResetPipeline}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Healed Banner inside Visualizer */}
        {healedInfo && !failedStageLog && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-emerald-200">Application Healed & Running in Production!</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon" />
                    LIVE · 200 OK
                  </span>
                </div>
                <p className="text-xs text-emerald-300/90 font-mono mt-1">
                  Fix Applied: {healedInfo.fixName}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>Target: {healedInfo.service}</span>
                  <span>•</span>
                  <span>Pod Health: 3/3 Replicas Ready</span>
                  <span>•</span>
                  <span>Traffic: 100% Routed</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/deployments"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>View in Deployments</span>
              </Link>
              <button
                onClick={handleResetPipeline}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Run Another</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Runner Console Log */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            CI/CD Runner Output Console
          </span>
          <span className="text-xs font-mono text-slate-400">
            Runner: ubuntu-latest (k8s-agent-4)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-black/90 border border-slate-800 font-mono text-xs text-slate-300 min-h-[100px] flex items-center">
          <p className="text-emerald-400">
            {activeLog || 'Ready for simulation. Select a failure scenario above and click "Run Simulation".'}
          </p>
        </div>
      </div>
    </div>
  );
}
