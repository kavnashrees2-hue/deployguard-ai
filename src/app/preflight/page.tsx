'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Terminal, 
  ArrowRight, 
  RotateCcw, 
  Zap, 
  Cpu, 
  Database, 
  Radio, 
  FileCode, 
  Check,
  SearchCode
} from 'lucide-react';
import { PreFlightAssessment, Environment } from '@/lib/types';

interface PresetDiff {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  serviceName: string;
  environment: Environment;
  commitMessage: string;
  codeDiff: string;
  touchesDatabase: boolean;
  touchesResources: boolean;
  touchesNetwork: boolean;
  touchesDependencies: boolean;
}

const PRESET_DIFFS: PresetDiff[] = [
  {
    id: 'risky-migration',
    title: 'Unsafe DDL Migration on 10M Rows',
    badge: 'Critical Risk',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    serviceName: 'billing-transaction-worker',
    environment: 'production',
    commitMessage: 'feat(db): alter table billing_transactions drop column legacy_acct_id and add index',
    codeDiff: `-- Migration: 20261101_drop_legacy_account.sql
-- WARNING: ACCESS EXCLUSIVE LOCK ON billing_transactions
ALTER TABLE billing_transactions DROP COLUMN legacy_acct_id;
CREATE INDEX idx_transactions_created ON billing_transactions(created_at);`,
    touchesDatabase: true,
    touchesResources: false,
    touchesNetwork: false,
    touchesDependencies: false
  },
  {
    id: 'memory-spike',
    title: 'Unbounded In-Memory Cache (No Limit)',
    badge: 'OOM Risk',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    serviceName: 'order-processing-api',
    environment: 'production',
    commitMessage: 'perf: cache user telemetry in local in-memory Map for sub-millisecond retrieval',
    codeDiff: `// services/telemetryCache.ts
const userCache = new Map<string, any>(); // Unbounded heap growth!
export function trackEvent(userId: string, data: any) {
  userCache.set(userId + '_' + Date.now(), Buffer.alloc(1024 * 1024, JSON.stringify(data)));
  // Missing eviction policy & Kubernetes resources.limits.memory is 512Mi
}`,
    touchesDatabase: false,
    touchesResources: true,
    touchesNetwork: false,
    touchesDependencies: false
  },
  {
    id: 'port-network',
    title: 'Port 8080 Binding & TLS Changes',
    badge: 'Network Conflict',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    serviceName: 'payment-gateway-proxy',
    environment: 'production',
    commitMessage: 'feat(ingress): rebind server to hardcoded 0.0.0.0:8080 and refresh TLS certificates',
    codeDiff: `// server.ts
const PORT = 8080; // Collides with existing microservices on host!
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Proxy listening on 0.0.0.0:\${PORT}\`);
});`,
    touchesDatabase: false,
    touchesResources: false,
    touchesNetwork: true,
    touchesDependencies: false
  },
  {
    id: 'safe-ui',
    title: 'Frontend UI & Telemetry Refactor',
    badge: 'Clean / Safe',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    serviceName: 'dashboard-frontend',
    environment: 'production',
    commitMessage: 'fix(ui): optimize dashboard rendering, update icons and split vendor bundles',
    codeDiff: `// components/Dashboard.tsx
export default function Dashboard() {
  return <div className="p-4">Optimized CSS styles & clean React tree</div>;
}`,
    touchesDatabase: false,
    touchesResources: false,
    touchesNetwork: false,
    touchesDependencies: false
  }
];

export default function PreFlightPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('risky-migration');
  const [serviceName, setServiceName] = useState('billing-transaction-worker');
  const [environment, setEnvironment] = useState<Environment>('production');
  const [commitMessage, setCommitMessage] = useState(PRESET_DIFFS[0].commitMessage);
  const [codeDiff, setCodeDiff] = useState(PRESET_DIFFS[0].codeDiff);
  const [touchesDatabase, setTouchesDatabase] = useState(true);
  const [touchesResources, setTouchesResources] = useState(false);
  const [touchesNetwork, setTouchesNetwork] = useState(false);
  const [touchesDependencies, setTouchesDependencies] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<PreFlightAssessment | null>(null);
  const [autoFixed, setAutoFixed] = useState(false);

  const handleApplyPreset = (preset: PresetDiff) => {
    setSelectedPresetId(preset.id);
    setServiceName(preset.serviceName);
    setEnvironment(preset.environment);
    setCommitMessage(preset.commitMessage);
    setCodeDiff(preset.codeDiff);
    setTouchesDatabase(preset.touchesDatabase);
    setTouchesResources(preset.touchesResources);
    setTouchesNetwork(preset.touchesNetwork);
    setTouchesDependencies(preset.touchesDependencies);
    setAutoFixed(false);
    runAnalysis({
      serviceName: preset.serviceName,
      environment: preset.environment,
      commitMessage: preset.commitMessage,
      codeDiff: preset.codeDiff,
      author: 'dev.engineer',
      touchesDatabase: preset.touchesDatabase,
      touchesResources: preset.touchesResources,
      touchesNetwork: preset.touchesNetwork,
      touchesDependencies: preset.touchesDependencies
    });
  };

  const runAnalysis = async (overrideData?: any) => {
    try {
      setAnalyzing(true);
      const payload = overrideData || {
        serviceName,
        environment,
        commitMessage,
        codeDiff,
        author: 'dev.engineer',
        touchesDatabase,
        touchesResources,
        touchesNetwork,
        touchesDependencies
      };

      const res = await fetch('/api/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setAssessment(json.data);
      }
    } catch (err) {
      console.error('Pre-flight error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run initial analysis on first mount
  React.useEffect(() => {
    runAnalysis();
  }, []);

  const handleApplyAutoFix = () => {
    setAutoFixed(true);
    let cleanDiff = codeDiff;
    let cleanCommit = commitMessage;
    let cleanDb = touchesDatabase;
    let cleanRes = touchesResources;
    let cleanNet = touchesNetwork;

    if (touchesDatabase) {
      cleanCommit = 'feat(db): safe zero-downtime migration with shadow column & concurrent index';
      cleanDiff = `-- Safe expand-and-contract migration
-- Step 1: Add non-blocking column without lock
ALTER TABLE billing_transactions ADD COLUMN IF NOT EXISTS new_acct_id VARCHAR(64) DEFAULT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created ON billing_transactions(created_at);`;
      cleanDb = false;
    } else if (touchesResources) {
      cleanCommit = 'perf: cache user telemetry with LRU eviction and 1.5Gi pod memory limit';
      cleanDiff = `// Fixed with QuickLRU cache & Kubernetes resource headroom
import QuickLRU from 'quick-lru';
const lru = new QuickLRU({ maxSize: 10000 }); // Bounded memory!
// kubernetes.yaml: resources.limits.memory set to 1.5Gi (requests: 768Mi)`;
      cleanRes = false;
    } else if (touchesNetwork) {
      cleanCommit = 'feat(ingress): dynamic port binding with zero port collisions';
      cleanDiff = `const PORT = process.env.PORT || 8081; // Safe non-colliding port
server.listen(PORT, '0.0.0.0');`;
      cleanNet = false;
    }

    setCodeDiff(cleanDiff);
    setCommitMessage(cleanCommit);
    setTouchesDatabase(cleanDb);
    setTouchesResources(cleanRes);
    setTouchesNetwork(cleanNet);

    runAnalysis({
      serviceName,
      environment,
      commitMessage: cleanCommit,
      codeDiff: cleanDiff,
      author: 'deployguard.ai',
      touchesDatabase: cleanDb,
      touchesResources: cleanRes,
      touchesNetwork: cleanNet,
      touchesDependencies: false
    });
  };

  return (
    <div className="space-y-8">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Pre-Deployment AI Risk Gatekeeper</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Proactive Pre-Flight Check
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyze code diffs, database migrations, and resource limits to predict and block deployment failures before rollout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            AI Policy Guard Active
          </span>
        </div>
      </div>

      {/* Preset Scenarios Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sample Pre-Flight Scenarios (1-Click Test)
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">Click any scenario to test the gatekeeper</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_DIFFS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  <p className="text-xs font-bold text-white mt-2 leading-tight">
                    {p.title}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-3 truncate">{p.serviceName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Left (Flight Check Configuration) / Right (Gatekeeper Assessment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Code Diff & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Change Payload & Metadata
              </span>
              <span className="text-xs font-mono text-slate-400">Target: {environment}</span>
            </div>

            {/* Service & Environment Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Service</label>
                <select
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="billing-transaction-worker">billing-transaction-worker</option>
                  <option value="order-processing-api">order-processing-api</option>
                  <option value="payment-gateway-proxy">payment-gateway-proxy</option>
                  <option value="auth-service">auth-service</option>
                  <option value="dashboard-frontend">dashboard-frontend</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as Environment)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="production">Production (Strict Gate)</option>
                  <option value="staging">Staging (Advisory)</option>
                  <option value="development">Development (Permissive)</option>
                </select>
              </div>
            </div>

            {/* Commit Message */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Commit Message / PR Title</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/80 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* High-Risk Checkbox Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={touchesDatabase}
                  onChange={(e) => setTouchesDatabase(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>DB Schema / DDL</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={touchesResources}
                  onChange={(e) => setTouchesResources(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Memory / CPU Limits</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={touchesNetwork}
                  onChange={(e) => setTouchesNetwork(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Port / Network Socket</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={touchesDependencies}
                  onChange={(e) => setTouchesDependencies(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Dependencies / Packages</span>
              </label>
            </div>

            {/* Code Diff Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Code / DDL Diff Snippet</label>
                <span className="text-[10px] text-slate-500 font-mono">{codeDiff.length} chars</span>
              </div>
              <textarea
                value={codeDiff}
                onChange={(e) => setCodeDiff(e.target.value)}
                rows={7}
                className="w-full p-3 rounded-xl bg-black/90 border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <button
              onClick={() => runAnalysis()}
              disabled={analyzing}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <SearchCode className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Evaluating Risk Model...' : 'Run Pre-Flight Risk Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Gatekeeper Verdict & Blast Radius (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {assessment && (
            <>
              {/* Verdict Banner */}
              <div className={`p-6 rounded-3xl border backdrop-blur-md shadow-2xl transition-all ${
                assessment.decision === 'BLOCKED'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : assessment.decision === 'CAUTION'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                      assessment.decision === 'BLOCKED'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : assessment.decision === 'CAUTION'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    }`}>
                      {assessment.decision === 'BLOCKED' ? (
                        <XCircle className="w-8 h-8" />
                      ) : assessment.decision === 'CAUTION' ? (
                        <AlertTriangle className="w-8 h-8" />
                      ) : (
                        <ShieldCheck className="w-8 h-8" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${
                          assessment.decision === 'BLOCKED'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                            : assessment.decision === 'CAUTION'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        }`}>
                          GATE DECISION: {assessment.decision}
                        </span>

                        <span className="text-xs font-mono text-slate-400">
                          Risk Score: <strong className="text-white">{assessment.riskScore}/100</strong> ({assessment.riskLevel})
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-1.5">
                        {assessment.decision === 'BLOCKED'
                          ? 'Deployment Halted by AI Policy Gatekeeper'
                          : assessment.decision === 'CAUTION'
                          ? 'Manual SRE Approval Required Before Rollout'
                          : 'Green Light: Ready for Automated Production Rollout'}
                      </h3>

                      <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                        {assessment.summary}
                      </p>
                    </div>
                  </div>

                  {/* Auto-Fix button for blocked deployments */}
                  {assessment.decision === 'BLOCKED' && (
                    <button
                      onClick={handleApplyAutoFix}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      <Zap className="w-4 h-4 fill-white animate-bounce" />
                      <span>⚡ Auto-Sanitize & Fix Diff</span>
                    </button>
                  )}
                </div>

                {/* Predicted Failure Mode Callout */}
                {assessment.predictedFailureMode && assessment.decision !== 'APPROVED' && (
                  <div className="mt-4 p-3.5 rounded-xl bg-black/60 border border-slate-800 flex items-start gap-3 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Predicted Failure Signature: </span>
                      <span className="text-rose-300 font-mono">{assessment.predictedFailureMode}</span>
                      <span className="text-slate-400 block mt-0.5 font-mono">
                        Failure Probability: <strong className="text-white">{assessment.failureProbability}%</strong> based on telemetry models.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Blast Radius Microservices Impact Graph */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Predictive Blast Radius (Impacted Dependencies)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {assessment.blastRadius.length} Microservices at Risk
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {assessment.blastRadius.map((svc, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs text-slate-200 font-mono flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        i === 0 ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                      }`} />
                      <span>{svc}</span>
                      <span className="text-[10px] text-slate-500">{i === 0 ? 'Source' : 'Downstream'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pre-Flight Checklist */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pre-Flight Architectural Verification Checklist
                </span>

                <div className="space-y-2">
                  {assessment.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                        item.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                          : 'bg-rose-500/5 border-rose-500/20 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {item.passed ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          {item.tip && <p className="text-[11px] text-slate-400 mt-0.5">{item.tip}</p>}
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                        item.passed
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      }`}>
                        {item.passed ? 'PASSED' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  AI Policy Recommendations & Mitigations
                </span>

                <ul className="space-y-2 text-xs text-slate-300">
                  {assessment.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30">
                      <span className="text-indigo-400 font-bold shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Confidence: High (Pattern matching & historical telemetry correlation)
                  </span>

                  <Link
                    href="/pipeline"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <span>Test Rollout in Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

