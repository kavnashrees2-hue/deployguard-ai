'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Zap, 
  Server, 
  Database, 
  Layers, 
  ArrowRight, 
  Cpu, 
  ExternalLink,
  Radio,
  Terminal,
  Activity,
  Network
} from 'lucide-react';
import { ChaosNode, ChaosScenario } from '@/lib/types';

export default function ChaosStudioPage() {
  const [nodes, setNodes] = useState<ChaosNode[]>([]);
  const [scenarios, setScenarios] = useState<ChaosScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<ChaosScenario | null>(null);
  const [systemStatus, setSystemStatus] = useState<'HEALTHY' | 'DEGRADED' | 'CRITICAL'>('HEALTHY');
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([]);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healingStep, setHealingStep] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/chaos');
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
        setScenarios(data.scenarios || []);
        setActiveScenario(data.activeScenario || null);
        setSystemStatus(data.systemStatus || 'HEALTHY');
        setLogs(data.logs || []);
        setActiveIncidentId(data.activeIncidentId || null);
      }
    } catch (err) {
      console.error('Failed to load chaos topology state:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleInject = async (scenarioId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'inject', scenarioId })
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes);
        setActiveScenario(data.activeScenario);
        setSystemStatus(data.systemStatus);
        setLogs(data.logs);
        setActiveIncidentId(data.incidentId);
      }
    } catch (err) {
      console.error('Failed to inject chaos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeal = async () => {
    setIsLoading(true);
    setHealingStep('Diagnosing microservice blast radius & isolating noisy neighbors...');
    
    setTimeout(() => {
      setHealingStep('Executing cluster hotfix & recycling poisoned connection pools...');
    }, 600);

    setTimeout(() => {
      setHealingStep('Validating synthetic HTTP 200 health probes across mesh...');
    }, 1200);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/chaos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heal' })
        });
        if (res.ok) {
          const data = await res.json();
          setNodes(data.nodes);
          setActiveScenario(null);
          setSystemStatus('HEALTHY');
          setLogs(data.logs);
          setActiveIncidentId(null);
        }
      } catch (err) {
        console.error('Failed to execute healing:', err);
      } finally {
        setIsLoading(false);
        setHealingStep(null);
      }
    }, 1800);
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes);
        setActiveScenario(null);
        setSystemStatus('HEALTHY');
        setLogs(data.logs);
        setActiveIncidentId(null);
      }
    } catch (err) {
      console.error('Failed to reset chaos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'INGRESS':
        return <Network className="w-5 h-5 text-cyan-400" />;
      case 'GATEWAY':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'DATABASE':
        return <Database className="w-5 h-5 text-emerald-400" />;
      case 'CACHE':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      default:
        return <Server className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Chaos Engineering & Microservice Resilience Studio
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                  Live Sandbox
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Inject distributed system failures into production topology. Watch DeployGuard isolate blast radius and execute zero-downtime self-healing.
              </p>
            </div>
          </div>
        </div>

        {/* Global Status & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            systemStatus === 'CRITICAL'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
              : systemStatus === 'DEGRADED'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              systemStatus === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
              systemStatus === 'DEGRADED' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span>Status: {systemStatus}</span>
          </div>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            title="Reset topology to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {systemStatus !== 'HEALTHY' && (
            <button
              onClick={handleHeal}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 border border-emerald-400/30 animate-beacon"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{healingStep ? 'Remediating...' : '⚡ Engage Autonomous Self-Healing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Incident Flash Banner (if active) */}
      {activeScenario && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-slate-900 border border-rose-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-rose-300">
                  ACTIVE OUTAGE: {activeScenario.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Target: {activeScenario.targetService}
                </span>
                {activeIncidentId && (
                  <Link
                    href="/incidents"
                    className="text-[10px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline ml-2"
                  >
                    View in Incidents ({activeIncidentId})
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                {activeScenario.description}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                <span className="text-slate-400 font-medium">Blast Radius:</span>
                {activeScenario.blastRadius.map((svc) => (
                  <span
                    key={svc}
                    className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] border border-rose-500/30"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleHeal}
            disabled={isLoading}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 border border-emerald-400 transition"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ Run Self-Healing Runbook</span>
          </button>
        </div>
      )}

      {/* Healing In-Progress Banner */}
      {healingStep && (
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-cyan-300">{healingStep}</span>
        </div>
      )}

      {/* Topology Mesh Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Production Microservice Mesh</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">6 Nodes Monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => {
            const isTarget = activeScenario?.targetService === node.id;
            const inBlast = activeScenario?.blastRadius.includes(node.id);

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                  node.status === 'DOWN'
                    ? 'bg-rose-950/25 border-rose-500/50 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
                    : node.status === 'DEGRADED'
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Node Status Banner */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                      {getNodeIcon(node.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{node.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{node.id}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      node.status === 'DOWN'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                        : node.status === 'DEGRADED'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                {/* Node Details Description */}
                <p className="text-xs text-slate-400 mb-3 line-clamp-1">{node.details}</p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Latency</span>
                    <span
                      className={`font-mono font-bold ${
                        node.latencyMs > 100
                          ? 'text-rose-400'
                          : node.latencyMs > 40
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {node.latencyMs}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Error Rate</span>
                    <span
                      className={`font-mono font-bold ${
                        node.errorRate > 0.1
                          ? 'text-rose-400'
                          : node.errorRate > 0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {(node.errorRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Replicas</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {node.activeReplicas}
                    </span>
                  </div>
                </div>

                {/* Badge if involved in active chaos */}
                {isTarget && (
                  <div className="mt-2.5 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>Epocenter of Fault Injection</span>
                  </div>
                )}
                {!isTarget && inBlast && (
                  <div className="mt-2.5 text-[10px] font-medium text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Impacted by Upstream Cascade</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fault Injection Catalog */}
      <div className="border border-slate-800 rounded-xl bg-slate-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Production Fault Injection Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a real-world chaos scenario to simulate failure modes and test self-healing resilience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((scenario) => {
            const isActive = activeScenario?.id === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-rose-950/30 border-rose-500/50 ring-1 ring-rose-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">{scenario.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {scenario.targetService}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Blast: {scenario.blastRadius.length} services
                  </span>
                  <button
                    onClick={() => handleInject(scenario.id)}
                    disabled={isLoading || isActive}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-rose-600/30 text-rose-300 cursor-not-allowed border border-rose-500/40'
                        : 'bg-rose-600/15 text-rose-400 hover:bg-rose-600/25 border border-rose-500/30'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{isActive ? 'Active Fault' : 'Inject Fault'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time SRE Event Stream & Terminal */}
      <div className="border border-slate-800 rounded-xl bg-[#090d16] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Live SRE Audit & Autonomous Remediation Console
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
            <span>Telemetry Active</span>
          </div>
        </div>

        <div className="font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto pr-2">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-400 text-[10px] shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`text-[10px] font-bold px-1 rounded shrink-0 ${
                  log.level === 'ERROR'
                    ? 'bg-rose-500/20 text-rose-400'
                    : log.level === 'WARN'
                    ? 'bg-amber-500/20 text-amber-400'
                    : log.level === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {log.level}
              </span>
              <span
                className={`text-slate-300 ${
                  log.level === 'SUCCESS' ? 'text-emerald-300 font-semibold' : ''
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

