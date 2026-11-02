'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Send, 
  Check, 
  Copy, 
  X,
  Search,
  Server,
  ShieldAlert,
  Terminal,
  CheckCircle,
  AlertTriangle,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Incident, IncidentStatus } from '@/lib/types';
import { getIncidentStatusBadge, getSeverityBadge, getEnvironmentBadge, formatDate, formatTimeAgo } from '@/lib/utils';

function IncidentsContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showPostMortemModal, setShowPostMortemModal] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedAllCommands, setCopiedAllCommands] = useState(false);
  const [copiedStepIndex, setCopiedStepIndex] = useState<number | null>(null);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);
  const [healingIncident, setHealingIncident] = useState(false);
  const [healSuccessMsg, setHealSuccessMsg] = useState<string | null>(null);

  const handleAutoHealIncident = async () => {
    if (!activeIncident || healingIncident) return;
    try {
      setHealingIncident(true);
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: activeIncident.id,
          serviceName: activeIncident.serviceName,
          fixTitle: activeIncident.recommendedSolution || activeIncident.rootCause
        })
      });
      const data = await res.json();
      if (res.ok) {
        setHealSuccessMsg('Application healed & verified! Restored to production traffic (200 OK).');
        setTimeout(() => setHealSuccessMsg(null), 5000);
        await fetchIncidents();
      }
    } catch (err) {
      console.error('Failed to auto-heal incident:', err);
    } finally {
      setHealingIncident(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/incidents?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setIncidents(data.data);
        setActiveIncident((prev) => {
          if (targetId) {
            const targeted = data.data.find((i: Incident) => i.id.toLowerCase() === targetId.toLowerCase());
            if (targeted) return targeted;
          }
          if (prev) {
            const updated = data.data.find((i: Incident) => i.id === prev.id);
            return updated || (data.data.length > 0 ? data.data[0] : null);
          }
          return data.data.length > 0 ? data.data[0] : null;
        });
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const onSeed = () => {
      fetchIncidents();
    };
    window.addEventListener('deployguard:seed', onSeed);
    return () => {
      window.removeEventListener('deployguard:seed', onSeed);
    };
  }, [targetId]);

  // Filtered incidents based on Search, Status, and Severity
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Status filter
      if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
      // Severity filter
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = inc.id.toLowerCase().includes(q);
        const matchService = inc.serviceName.toLowerCase().includes(q);
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchError = inc.error ? inc.error.toLowerCase().includes(q) : false;
        const matchRoot = inc.rootCause.toLowerCase().includes(q);
        if (!matchId && !matchService && !matchTitle && !matchError && !matchRoot) return false;
      }
      return true;
    });
  }, [incidents, selectedStatus, selectedSeverity, searchQuery]);

  const handleUpdateStatus = async (incidentId: string, newStatus: IncidentStatus, customResolution?: string) => {
    try {
      const payload: Record<string, unknown> = {
        status: newStatus,
        newTimelineMessage: customResolution 
          ? `Incident resolved: ${customResolution}`
          : `Status changed from ${activeIncident?.status || 'UNKNOWN'} to ${newStatus} by on-call engineer.`
      };

      if (newStatus === 'RESOLVED' && customResolution) {
        payload.resolution = customResolution;
      }

      const res = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveIncident(json.data);
        }
        fetchIncidents();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openResolutionDialog = () => {
    if (!activeIncident) return;
    setResolutionText(
      activeIncident.resolution || 
      activeIncident.recommendedSolution || 
      'Applied suggested remediation steps, updated resource limits, and verified steady-state health in cluster.'
    );
    setShowResolveModal(true);
  };

  const handleConfirmResolve = async () => {
    if (!activeIncident) return;
    try {
      setResolving(true);
      await handleUpdateStatus(activeIncident.id, 'RESOLVED', resolutionText.trim());
      setShowResolveModal(false);
    } finally {
      setResolving(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident || !newNote.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/incidents/${activeIncident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTimelineMessage: newNote.trim(),
          author: 'sarah.jenkins'
        })
      });
      if (res.ok) {
        setNewNote('');
        fetchIncidents();
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCopyAllCommands = () => {
    if (!activeIncident?.remediationSteps) return;
    const commands = activeIncident.remediationSteps
      .map((s) => s.command)
      .filter(Boolean)
      .join('\n\n');
    if (!commands) return;
    navigator.clipboard.writeText(commands);
    setCopiedAllCommands(true);
    setTimeout(() => setCopiedAllCommands(false), 2000);
  };

  const handleCopyStepCommand = (command: string, idx: number) => {
    navigator.clipboard.writeText(command);
    setCopiedStepIndex(idx);
    setTimeout(() => setCopiedStepIndex(null), 2000);
  };

  const generateMarkdownReport = (inc: Incident): string => {
    return `# SRE Incident Post-Mortem Report: ${inc.title}

**Incident ID:** ${inc.id}
**Service Affected:** ${inc.serviceName} (${inc.environment})
**Severity:** ${inc.severity}
**Status:** ${inc.status}
**Lead SRE / Assignee:** ${inc.assignee}
**Triggered At:** ${inc.createdAt}
**Resolved At:** ${inc.resolvedAt || 'Ongoing'}
**Resolution:** ${inc.resolution || inc.recommendedSolution || 'In Progress'}

---

## 1. Executive Summary
${inc.postMortem?.summary || inc.rootCause}

## 2. Root Cause Analysis (5-Whys)
- **Root Cause Identified:** ${inc.rootCause}
- **Category:** ${inc.category}
- **Linked Deployment:** ${inc.deploymentId || 'Manual Trigger'}

## 3. Recommended & Applied Resolution
- **Recommended Solution:** ${inc.recommendedSolution || 'Runbook steps executed'}
- **Actual Resolution:** ${inc.resolution || 'Pending full sign-off'}

## 4. Impact Assessment
- **Estimated Downtime / Impact Duration:** ${inc.postMortem?.impactDurationMinutes || 20} minutes
- **Customer / Worker Impact:** ${inc.postMortem?.affectedUsersApprox || 'Degraded microservice worker processing'}

## 5. Incident Timeline
${inc.timeline.map((t) => `- **${formatDate(t.timestamp)}** [${t.author}]: ${t.message}`).join('\n')}

## 6. Preventative Action Items
${inc.postMortem?.actionItems ? inc.postMortem.actionItems.map((a) => `- [ ] ${a}`).join('\n') : '- [ ] Implement automated healthcheck timeout alerts\n- [ ] Update staging load tests\n- [ ] Review resource quota requests in K8s spec'}

---
*Generated autonomously by DeployGuard AI System*
`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Incident Management & Runbooks</h1>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {filteredIncidents.length} shown of {incidents.length} total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track microservice deployment failures, review recommended solutions, and approve remediation runbooks.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Severity & Status Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Severity:</span>
          {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
            const isSelected = selectedSeverity === sev;
            const count = sev === 'all' 
              ? incidents.length 
              : incidents.filter((i) => i.severity === sev).length;

            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? sev === 'CRITICAL'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : sev === 'HIGH'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : sev === 'MEDIUM'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : sev === 'LOW'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{sev}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Status:</span>
          {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => {
            const isSelected = selectedStatus === st;
            const count = st === 'all'
              ? incidents.length
              : incidents.filter((i) => i.status === st || (st === 'IN_PROGRESS' && (i.status === 'INVESTIGATING' || i.status === 'MITIGATED'))).length;

            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? st === 'RESOLVED'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : st === 'OPEN'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{st === 'IN_PROGRESS' ? 'In Progress' : st.toLowerCase()}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Incident List (Left) + Detail Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident Cards Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">
              Loading incident board...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No matching incidents found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'Try clearing your search query or filters.' : 'All deployment services running smoothly.'}
              </p>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = activeIncident?.id === inc.id;
              const statusBadge = getIncidentStatusBadge(inc.status);
              const sevBadge = getSeverityBadge(inc.severity);

              return (
                <div
                  key={inc.id}
                  onClick={() => setActiveIncident(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-500/10'
                      : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80'
                  }`}
                >
                  {/* Top Bar: ID + Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                      {inc.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${sevBadge.bg} ${sevBadge.text} ${sevBadge.border}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {inc.status === 'IN_PROGRESS' || inc.status === 'INVESTIGATING' ? 'In Progress' : inc.status}
                      </span>
                    </div>
                  </div>

                  {/* Error & Title */}
                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {inc.error || inc.title}
                  </h3>

                  {/* Service */}
                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 mt-1">
                    <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-semibold font-mono">{inc.serviceName}</span>
                  </div>

                  {/* Root cause */}
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    <strong className="text-slate-300">Root cause:</strong> {inc.rootCause}
                  </p>

                  {/* Resolution if present */}
                  {(inc.resolution || inc.recommendedSolution) && (
                    <div className="mt-2 text-[11px] text-emerald-400/90 font-medium line-clamp-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      <span>{inc.resolution ? `Resolution: ${inc.resolution}` : `Fix: ${inc.recommendedSolution}`}</span>
                    </div>
                  )}

                  {/* Footer: Created time */}
                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatDate(inc.createdAt)}
                    </span>
                    <span className="text-slate-400">{formatTimeAgo(inc.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Detail & Remediation Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {activeIncident ? (
            <div className="space-y-6">
              {/* Incident Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-mono text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                        {activeIncident.id}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-indigo-400" />
                        {activeIncident.serviceName}
                      </span>
                      {(() => {
                        const envBadge = getEnvironmentBadge(activeIncident.environment);
                        return (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${envBadge.bg} ${envBadge.text} ${envBadge.border}`}>
                            {activeIncident.environment}
                          </span>
                        );
                      })()}
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {activeIncident.error || activeIncident.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setShowPostMortemModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Post-Mortem Report</span>
                  </button>
                </div>

                {/* Root Cause & Error Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Identified Root Cause
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {activeIncident.rootCause}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Recommended Solution
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {activeIncident.recommendedSolution || 'Consult the attached runbook steps below for remediation commands.'}
                    </p>
                  </div>
                </div>

                {/* Actual Recorded Resolution (if resolved) */}
                {activeIncident.status === 'RESOLVED' && activeIncident.resolution && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Recorded Resolution Fix
                      </span>
                      <span className="text-[11px] text-emerald-400/80 font-mono">
                        {activeIncident.resolvedAt ? formatDate(activeIncident.resolvedAt) : 'Resolved'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed pt-1">
                      {activeIncident.resolution}
                    </p>
                  </div>
                )}

                {/* Status Stepper Workflow: Open -> In Progress -> Resolved */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Incident Lifecycle State:
                    </span>
                    <span className="text-xs font-mono text-indigo-300 font-semibold">
                      Current: {activeIncident.status === 'IN_PROGRESS' || activeIncident.status === 'INVESTIGATING' ? 'In Progress' : activeIncident.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(activeIncident.id, 'OPEN')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeIncident.status === 'OPEN'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-mono">STEP 1</span>
                      <span>1. Open</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(activeIncident.id, 'IN_PROGRESS')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeIncident.status === 'IN_PROGRESS' || activeIncident.status === 'INVESTIGATING'
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-mono">STEP 2</span>
                      <span>2. In Progress</span>
                    </button>

                    <button
                      onClick={openResolutionDialog}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeIncident.status === 'RESOLVED'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-mono">STEP 3</span>
                      <span>3. Resolved</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Remediation Runbook (Phase 2 Enhancement) */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Remediation Runbook
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review each command before executing on your cluster.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeIncident.status !== 'RESOLVED' && (
                      <button
                        onClick={handleAutoHealIncident}
                        disabled={healingIncident}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 fill-white ${healingIncident ? 'animate-bounce' : ''}`} />
                        <span>{healingIncident ? 'Executing Runbook...' : '⚡ Auto-Heal Application'}</span>
                      </button>
                    )}

                    {activeIncident.remediationSteps && activeIncident.remediationSteps.length > 0 && (
                      <button
                        onClick={handleCopyAllCommands}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        title="Copy all commands"
                      >
                        {copiedAllCommands ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied All</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Commands</span>
                          </>
                        )}
                      </button>
                    )}

                    {activeIncident.status !== 'RESOLVED' && (
                      <button
                        onClick={openResolutionDialog}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Resolved</span>
                      </button>
                    )}
                  </div>
                </div>

                {healSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono animate-in fade-in duration-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{healSuccessMsg}</span>
                  </div>
                )}

                {/* Safety Warning */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Human-in-the-loop:</strong> Commands are not automatically executed. Copy or approve and execute them in your cluster CLI after reviewing pod impact.
                  </span>
                </div>

                {/* Steps List */}
                <div className="space-y-3 pt-1">
                  {(!activeIncident.remediationSteps || activeIncident.remediationSteps.length === 0) ? (
                    <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      No automated steps recorded for this incident. Use manual cluster triage runbook.
                    </div>
                  ) : (
                    activeIncident.remediationSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              {step.step || idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-white">{step.title}</h4>
                          </div>

                          {step.command && (
                            <button
                              onClick={() => handleCopyStepCommand(step.command!, idx)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                              title="Copy this command"
                            >
                              {copiedStepIndex === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-[10px] text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[10px]">Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-8">
                          {step.description}
                        </p>

                        {step.command && (
                          <div className="ml-8 p-3 rounded-lg bg-black/90 border border-slate-800 overflow-x-auto">
                            <code className="text-xs font-mono text-emerald-300 whitespace-pre">
                              $ {step.command}
                            </code>
                          </div>
                        )}

                        {step.verificationCommand && (
                          <div className="ml-8 pt-1 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span className="text-cyan-400 font-bold">Verify:</span>
                            <code className="text-slate-300">$ {step.verificationCommand}</code>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Timeline Audit Log */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Incident Audit Timeline
                </h3>

                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {activeIncident.timeline.map((event, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 pl-8">
                      <span className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 shrink-0" />
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs flex-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                          <span className="font-semibold text-indigo-300">{event.author}</span>
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{event.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Timeline Note Form */}
                <form onSubmit={handleAddTimelineNote} className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add engineering update or triage observation..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
              <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Select an Incident to Inspect</p>
              <p className="text-xs text-slate-500 mt-1">Or analyze logs in the Log Analyzer to create one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Confirmation Modal */}
      {showResolveModal && activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Resolve Incident {activeIncident.id}</h3>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Record Actual Resolution & Action Taken:
                </label>
                <textarea
                  rows={4}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Specify the actions performed to resolve this incident..."
                  className="w-full p-3 rounded-xl bg-black/80 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                This will transition the incident status to <strong className="text-emerald-400">RESOLVED</strong>, stamp the resolution timestamp, and attach this record to the post-mortem audit trail.
              </p>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={resolving || !resolutionText.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{resolving ? 'Resolving...' : 'Confirm & Mark as Resolved'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Mortem Report Modal */}
      {showPostMortemModal && activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">SRE Post-Mortem Documentation</h3>
              </div>
              <button
                onClick={() => setShowPostMortemModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {generateMarkdownReport(activeIncident)}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Format: GitHub Flavored Markdown</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateMarkdownReport(activeIncident));
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Report</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPostMortemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Incidents...</div>}>
      <IncidentsContent />
    </Suspense>
  );
}
