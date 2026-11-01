'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Rocket, 
  SearchCode, 
  AlertOctagon, 
  GitBranch, 
  Database,
  Cpu,
  Layers,
  Sparkles,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface SidebarProps {
  storageType?: string;
}

export default function Sidebar({ storageType = 'Detecting...' }: SidebarProps) {
  const pathname = usePathname();
  const [activeStorage, setActiveStorage] = useState(storageType);

  useEffect(() => {
    // Check storage backend
    fetch('/api/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data.storage) {
          setActiveStorage(data.storage.type);
        }
      })
      .catch(() => setActiveStorage('In-Memory Store'));
  }, []);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      label: 'Deployments',
      href: '/deployments',
      icon: Rocket
    },
    {
      label: 'Log Analyzer',
      href: '/analyzer',
      icon: SearchCode,
      highlight: true
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: AlertOctagon
    },
    {
      label: 'Pipeline Visualizer',
      href: '/pipeline',
      icon: GitBranch
    },
    {
      label: 'Risk Gatekeeper',
      href: '/preflight',
      icon: ShieldAlert,
      tag: 'NEW',
      tagColor: 'indigo'
    },
    {
      label: 'Chaos Studio',
      href: '/chaos',
      icon: Flame,
      tag: 'NEW',
      tagColor: 'rose'
    }
  ];

  return (
    <aside className="w-64 bg-[#0c111d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">DeployGuard</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Failure Triage & DevOps SRE</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon" />
                      {item.badge}
                    </span>
                  )}

                  {item.highlight && !isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Rule Engine
                    </span>
                  )}

                  {item.tag && !isActive && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.tagColor === 'rose'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    }`}>
                      {item.tag}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Capabilities Pill */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Triage Core Active</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>Rule Engine:</span>
              <span className="text-emerald-400 font-medium">Offline Ready</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Signatures:</span>
              <span className="text-slate-200 font-mono">10 Patterns</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LLM Fallback:</span>
              <span className="text-cyan-400 font-medium">Gemini Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/60 bg-[#0a0e17]">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              Store:
            </span>
            <span className="text-slate-200 font-medium truncate max-w-[120px]" title={activeStorage}>
              {activeStorage}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              Runtime:
            </span>
            <span className="text-slate-300 font-mono text-[10px]">Next.js 16</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
