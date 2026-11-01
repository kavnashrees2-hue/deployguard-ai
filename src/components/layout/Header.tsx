'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';

interface HeaderProps {
  onDataRefresh?: () => void;
  activeIncidentsCount?: number;
}

export default function Header({ onDataRefresh, activeIncidentsCount = 0 }: HeaderProps) {
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        setSeedSuccess(true);
        setTimeout(() => {
          setSeedSuccess(false);
          if (onDataRefresh) {
            onDataRefresh();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 500);
      }
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleQuickSimulate = async (scenario: string) => {
    try {
      setSimulating(true);
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, serviceName: 'payment-gateway-proxy' })
      });
      if (res.ok) {
        if (onDataRefresh) {
          onDataRefresh();
        } else if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Simulate error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-xs font-medium text-slate-300">Cluster: <span className="text-emerald-400 font-mono">us-east-1 / k8s-prod</span></span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {activeIncidentsCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{activeIncidentsCount} Active Incident{activeIncidentsCount > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All Services Operational</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Simulator Dropdown / Action */}
        <div className="relative group">
          <button
            disabled={simulating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
            <span>{simulating ? 'Simulating Pipeline...' : 'Simulate Pipeline Failure'}</span>
          </button>

          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 hidden group-hover:block z-50">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Demo Failure Scenarios
            </div>
            <button
              onClick={() => handleQuickSimulate('oom_crash')}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>Kubernetes OOM Crash</span>
              <span className="text-[10px] text-rose-400">Exit 137</span>
            </button>
            <button
              onClick={() => handleQuickSimulate('db_lock')}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>DB Migration Lock</span>
              <span className="text-[10px] text-indigo-400">Timeout</span>
            </button>
            <button
              onClick={() => handleQuickSimulate('tls_expired')}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>TLS Cert Expiry</span>
              <span className="text-[10px] text-amber-400">SSL Error</span>
            </button>
            <button
              onClick={() => handleQuickSimulate('healthy')}
              className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 text-emerald-300 transition-colors flex items-center justify-between border-t border-slate-800/60 mt-1 pt-1.5"
            >
              <span>Healthy Deployment</span>
              <span className="text-[10px] text-emerald-400">Pass</span>
            </button>
          </div>
        </div>

        {/* Reset / Seed Button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/70 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
          title="Reset database to realistic initial sample data"
        >
          {seedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Reset Complete</span>
            </>
          ) : (
            <>
              <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Resetting...' : 'Seed Sample Data'}</span>
            </>
          )}
        </button>

        {/* Live SRE Mode Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium">Live SRE Guard</span>
        </div>
      </div>
    </header>
  );
}
