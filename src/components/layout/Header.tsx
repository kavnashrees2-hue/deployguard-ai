'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  Database,
  Dices
} from 'lucide-react';
import { SAMPLE_PROFILES } from '@/lib/db/dynamicProfiles';

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
        body: JSON.stringify({ 
          profile: profileId === 'default' ? 'default' : profileId,
          action: profileId === 'default' ? 'reset' : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveProfile(data.profile || profileId);
        const name = data.profileName || SAMPLE_PROFILES.find((p) => p.id === data.profile)?.name || data.profile;
        setSeedSuccessMsg(`Loaded: ${name}`);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('deployguard:seed', { detail: { profile: data.profile } }));
        }

        setTimeout(() => {
          setSeedSuccessMsg(null);
          if (onDataRefresh) {
            onDataRefresh();
          } else if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 500);
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
    <header className="h-16 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Cluster Status & Direct Feature Shortcuts */}
      <div className="flex items-center gap-2.5 sm:gap-4">
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
          <span className="hidden sm:inline">Risk Gatekeeper</span>
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
          <span className="hidden sm:inline">Chaos Studio</span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500 text-white shadow-xs">
            NEW
          </span>
        </Link>

        {/* Active Incidents Counter */}
        {activeIncidentsCount > 0 && (
          <Link
            href="/incidents"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold hover:bg-rose-500/20 transition hidden lg:flex"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{activeIncidentsCount} Active</span>
          </Link>
        )}
      </div>

      {/* Right side: Dynamic Sample Selector, Quick Simulator, Reset */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Success / Status Toast Indicator */}
        {seedSuccessMsg && (
          <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{seedSuccessMsg}</span>
          </span>
        )}

        {/* Button 1: PRIMARY ACTION - Change Sample (cycles to next dynamic profile) */}
        <button
          onClick={() => handleSeedProfile('next')}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 border border-indigo-400/30"
          title="Change sample fleet to next failure scenario (Cycles through Fintech, Multi-Cloud, AI Cluster, Random)"
        >
          <Dices className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Changing...' : 'Change Sample'}</span>
        </button>

        {/* Button 2: Dynamic Fleet Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            disabled={seeding}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
            title="Select specific dynamic sample fleet preset"
          >
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline font-semibold text-slate-300">
              {currentProfileMeta.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {profile.id === 'random' && <Dices className="w-3 h-3 text-amber-400" />}
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

        {/* Button 3: Reset Baseline Action */}
        <button
          onClick={() => handleSeedProfile('default')}
          disabled={seeding}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
          title="Reset database to clean baseline sample"
        >
          <RotateCcw className={`w-3 h-3 text-slate-400 ${seeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
