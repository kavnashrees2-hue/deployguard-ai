'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Check,
  ShieldAlert,
  Flame,
  Sparkles,
  ChevronDown,
  Database,
  Dices
} from 'lucide-react';
import { SAMPLE_PROFILES, SampleProfileMeta } from '@/lib/db/dynamicProfiles';

interface HeaderProps {
  onDataRefresh?: () => void;
  activeIncidentsCount?: number;
}

export default function Header({ onDataRefresh, activeIncidentsCount = 0 }: HeaderProps) {
  const [seeding, setSeeding] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string>('default');
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSeedProfile = async (profileId: string) => {
    try {
      setSeeding(true);
      setIsProfileOpen(false);
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(profileId);
        const name = SAMPLE_PROFILES.find((p) => p.id === profileId)?.name || profileId;
        setSeedSuccessMsg(`Seeded: ${name}`);
        setTimeout(() => {
          setSeedSuccessMsg(null);
          if (onDataRefresh) {
            onDataRefresh();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 600);
      }
    } catch (err) {
      console.error('Seed profile error:', err);
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

  const currentProfileMeta = SAMPLE_PROFILES.find((p) => p.id === activeProfile) || SAMPLE_PROFILES[0];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Cluster Status & Direct Feature Shortcuts */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
          <span className="text-xs font-medium text-slate-300 hidden md:inline">
            Cluster: <span className="text-emerald-400 font-mono">k8s-prod</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Feature 1 Header Shortcut: Risk Gatekeeper */}
        <Link
          href="/preflight"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition shadow-sm group"
          title="Pre-Deployment AI Risk Gatekeeper: Evaluate commits before release"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline">Risk Gatekeeper</span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500 text-white shadow-xs">
            NEW
          </span>
        </Link>

        {/* Feature 2 Header Shortcut: Chaos Studio */}
        <Link
          href="/chaos"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition shadow-sm group"
          title="Chaos Engineering & Resilience Sandbox: Inject real faults & auto-heal"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline">Chaos Studio</span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500 text-white shadow-xs">
            NEW
          </span>
        </Link>

        {/* Active Incidents Counter */}
        {activeIncidentsCount > 0 ? (
          <Link
            href="/incidents"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{activeIncidentsCount} Active</span>
          </Link>
        ) : (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fleet Healthy</span>
          </div>
        )}
      </div>

      {/* Right side: Dynamic Sample Selector, Quick Simulator, Reset */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dynamic Sample Dataset Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
            title="Switch dynamic sample fleet dataset"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Fleet:</span>
            <span className="font-semibold text-white max-w-[110px] truncate">
              {currentProfileMeta.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Dynamic Sample Fleet
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">5 Presets</span>
              </div>

              <div className="space-y-1">
                {SAMPLE_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSeedProfile(profile.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                      activeProfile === profile.id
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {profile.id === 'random' && <Dices className="w-3.5 h-3.5 text-amber-400" />}
                        {profile.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {profile.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {profile.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Random Dynamic Generator Button */}
        <button
          onClick={() => handleSeedProfile('random')}
          disabled={seeding}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          title="🎲 Generate random dynamic outages with varied microservices & crash logs"
        >
          <Dices className="w-3.5 h-3.5 text-amber-400" />
          <span>Randomize</span>
        </button>

        {/* Quick Simulator Dropdown */}
        <div className="relative group hidden md:block">
          <button
            disabled={simulating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
            <span>Simulate Failure</span>
          </button>

          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 hidden group-hover:block z-50">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Trigger Live Scenario
            </div>
            <button
              onClick={() => handleQuickSimulate('oom_crash')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>Kubernetes OOM Crash</span>
              <span className="text-[10px] text-rose-400">Exit 137</span>
            </button>
            <button
              onClick={() => handleQuickSimulate('db_lock')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>DB Migration Lock</span>
              <span className="text-[10px] text-indigo-400">Timeout</span>
            </button>
            <button
              onClick={() => handleQuickSimulate('tls_expired')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-between"
            >
              <span>TLS Cert Expiry</span>
              <span className="text-[10px] text-amber-400">SSL Error</span>
            </button>
          </div>
        </div>

        {/* Reset / Seed Baseline Action */}
        <button
          onClick={() => handleSeedProfile('default')}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          title="Reset back to baseline data"
        >
          {seedSuccessMsg ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">{seedSuccessMsg}</span>
            </>
          ) : (
            <>
              <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${seeding ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{seeding ? 'Seeding...' : 'Reset'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
