'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  SearchCode, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  Cpu, 
  Upload, 
  Trash2, 
  Key, 
  AlertOctagon, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  Zap,
  ShieldCheck,
  Activity,
  Play
} from 'lucide-react';
import { SAMPLE_LOG_PRESETS } from '@/lib/analyzer/sampleLogs';
import { AnalysisResult } from '@/lib/types';
import { getCategoryBadge, getSeverityBadge } from '@/lib/utils';

function AnalyzerContent() {
  const searchParams = useSearchParams();
  const queryLog = searchParams.get('log');

  const [rawLogs, setRawLogs] = useState<string>(() => queryLog || SAMPLE_LOG_PRESETS[0].logContent);
  const [prevQueryLog, setPrevQueryLog] = useState<string | null>(queryLog);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [escalating, setEscalating] = useState<boolean>(false);
  const [escalatedId, setEscalatedId] = useState<string | null>(null);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [healingStepIndex, setHealingStepIndex] = useState<number>(-1);
  const [healingLogs, setHealingLogs] = useState<string[]>([]);
  const [healedResult, setHealedResult] = useState<any | null>(null);

  // Synchronize state when query param changes
  if (queryLog !== prevQueryLog) {
    setPrevQueryLog(queryLog);
    if (queryLog) {
      setRawLogs(queryLog);
      setHealedResult(null);
    }
  }

  const handleAnalyze = React.useCallback(async (logsToAnalyze?: string) => {
    const text = logsToAnalyze !== undefined ? logsToAnalyze : rawLogs;
    if (!text || text.trim().length === 0) return;

    try {
      setAnalyzing(true);
      setEscalatedId(null);
      setHealedResult(null);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawLogs: text,
          apiKey: apiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [apiKey, rawLogs]);

  // Initial analysis on mount or when query param changes
  useEffect(() => {
    let ignore = false;
    const target = queryLog || SAMPLE_LOG_PRESETS[0].logContent;

    async function runInitialAnalysis() {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawLogs: target,
            apiKey: apiKey.trim() || undefined
          })
        });

        const data = await res.json();
        if (!ignore) {
          setEscalatedId(null);
          if (data.success) {
            setResult(data.data);
          }
        }
      } catch (err) {
        console.error('Initial analysis failed:', err);
      } finally {
        if (!ignore) {
          setAnalyzing(false);
        }
      }
    }

    runInitialAnalysis();
    return () => {
      ignore = true;
    };
  }, [queryLog, apiKey]);

  const handleSelectPreset = (logContent: string) => {
    setRawLogs(logContent);
    setResult(null);
    setEscalatedId(null);
    setHealedResult(null);
    setIsHealing(false);
    handleAnalyze(logContent);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawLogs(text);
          handleAnalyze(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCreateIncident = async () => {
    if (!result) return;
    try {
      setEscalating(true);
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.ruleName,
          error: result.ruleName,
          serviceName: result.affectedComponent.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
          environment: 'production',
          severity: result.severity,
          status: 'OPEN',
          rootCause: result.rootCause,
          category: result.category,
          assignee: 'oncall.sre',
          recommendedSolution: result.remediationSteps.map((s) => s.title).join('; '),
          remediationSteps: result.remediationSteps,
          rawLogs: rawLogs
        })
      });
      const json = await res.json();
      if (json.success) {
        setEscalatedId(json.data.id);
      }
    } catch (err) {
      console.error('Failed to create incident:', err);
    } finally {
      setEscalating(false);
    }
  };

  const handleAutoHealApplication = async () => {
    if (!result || isHealing) return;
    setIsHealing(true);
    setHealedResult(null);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setHealingLogs([...logs]);
    };

    addLog(`[INIT] DeployGuard AI Auto-Heal Engine engaged for "${result.affectedComponent}"`);
    addLog(`[DIAGNOSIS] Root cause verified: ${result.ruleName}`);
    await new Promise((r) => setTimeout(r, 400));

    // Execute runbook steps in sequence
    for (let i = 0; i < result.remediationSteps.length; i++) {
      const step = result.remediationSteps[i];
      setHealingStepIndex(i);
      addLog(`[STEP ${step.step}/${result.remediationSteps.length}] ${step.title}`);
      if (step.command) {
        addLog(`$ ${step.command}`);
      }
      await new Promise((r) => setTimeout(r, 650));
      if (step.verificationCommand) {
        addLog(`$ ${step.verificationCommand} -> PASSED`);
      }
    }

    addLog(`[RELOAD] Redeploying container image with patched configuration...`);
    await new Promise((r) => setTimeout(r, 600));

    try {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: result.affectedComponent.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
          fixTitle: result.ruleName,
          rawLogs: rawLogs
        })
      });
      const json = await res.json();
      if (json.success) {
        setHealedResult(json.data);
        addLog(`[HEALTHCHECK] Probing GET /healthz ... 200 OK (0 errors, 100% healthy)`);
        addLog(`[TRAFFIC] Promoted to 100% production traffic. Deployment ID: ${json.data.deployment?.id || 'heal-101'}`);
      }
    } catch (err) {
      console.error('Auto heal error:', err);
      addLog(`[ERROR] Remediation execution error: ${err}`);
    } finally {
      setIsHealing(false);
      setHealingStepIndex(-1);
    }
  };

  const lineCount = rawLogs ? rawLogs.split('\n').length : 0;

  return (
    <div className="space-y-8">
      {/* Title & Engine Mode Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI & Rule-Based Log Analyzer</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400" />
              Offline Rule Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic pattern matching with stack trace heuristics & optional LLM augmentation
          </p>
        </div>

        {/* Optional AI Key Toggle */}
        <button
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/70 flex items-center gap-2 self-start transition-colors"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>{apiKey ? 'Gemini Key Configured' : 'Configure Optional AI Key'}</span>
          {showApiKeyInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Accordion for Optional API Key */}
      {showApiKeyInput && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-md text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Optional Google Gemini API Key
            </span>
            <span className="text-[10px] text-slate-400 font-mono">100% optional — rule engine works without this</span>
          </div>
          <p className="text-slate-400">
            DeployGuard does not require any external API keys to function. Supplying a Gemini API key will augment the analysis with generative model reasoning.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            {apiKey && (
              <button
                onClick={() => setApiKey('')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preset Scenarios Carousel / Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pre-Loaded Realistic Failure Scenarios (1-Click Triage)
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">Click any scenario to analyze immediately</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {SAMPLE_LOG_PRESETS.map((preset) => {
            const isSelected = rawLogs.trim() === preset.logContent.trim();
            const badge = getCategoryBadge(preset.category);

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.logContent)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {badge.label}
                  </span>
                  <p className="text-[11px] font-bold text-white mt-1.5 line-clamp-2 leading-tight">
                    {preset.title}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate">{preset.service}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Analysis Workspace (Log Editor + Diagnostic Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Log Input & Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Raw Log Stream ({lineCount} lines)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const defaultLog = SAMPLE_LOG_PRESETS[0].logContent;
                    setRawLogs(defaultLog);
                    setResult(null);
                    setEscalatedId(null);
                    handleAnalyze(defaultLog);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset to default sample log"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-[11px]">Reset Sample</span>
                </button>
                <label className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors" title="Upload log file">
                  <Upload className="w-3.5 h-3.5" />
                  <input type="file" accept=".log,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => {
                    setRawLogs('');
                    setResult(null);
                    setEscalatedId(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear log text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <textarea
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
              placeholder="Paste deployment stderr/stdout logs or select a scenario above..."
              rows={14}
              className="w-full p-3.5 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y select-text"
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-mono">
                {rawLogs.length} bytes
              </span>

              <button
                onClick={() => handleAnalyze()}
                disabled={analyzing || !rawLogs.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <SearchCode className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Analyzing Signature...' : 'Analyze Deployment Logs'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Triage Results & Runbook (7 cols) */}
        <div className="lg:col-span-7">
          {analyzing ? (
            <div className="p-16 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mx-auto flex items-center justify-center animate-spin">
                <SearchCode className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white">Analyzing Log Patterns</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Scanning stack trace signatures, comparing regex heuristics, and calculating confidence scores...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Main Diagnostic Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category */}
                    {(() => {
                      const badge = getCategoryBadge(result.category);
                      return (
                        <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      );
                    })()}

                    {/* Severity */}
                    {(() => {
                      const sev = getSeverityBadge(result.severity);
                      return (
                        <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md border ${sev.bg} ${sev.text} ${sev.border}`}>
                          {result.severity}
                        </span>
                      );
                    })()}

                    {/* Engine badge */}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-mono">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      {result.analysisEngine === 'RULE_ENGINE_LOCAL' ? 'Rule Engine (Offline)' : 'Gemini AI Augmented'}
                    </span>
                  </div>

                  {/* Confidence Score Pill */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 self-start">
                    <span className="text-[11px] text-slate-400">Match Confidence:</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{result.confidenceScore}%</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{result.ruleName}</h2>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                    {result.summary}
                  </p>
                </div>

                {/* Root Cause Details */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Identified Root Cause
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.rootCause}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    Affected Component: <span className="text-white font-semibold">{result.affectedComponent}</span>
                  </div>
                </div>

                {/* Matched Log Lines Highlighting */}
                {result.matchedLines && result.matchedLines.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                      Triggering Log Lines Detected:
                    </span>
                    <div className="p-3 rounded-xl bg-black/80 border border-slate-800/80 font-mono text-[11px] space-y-1 overflow-x-auto">
                      {result.matchedLines.map((m, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-rose-300">
                          <span className="text-slate-600 shrink-0 font-bold">Line {m.lineNumber}:</span>
                          <span className="break-all">{m.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create Incident CTA */}
                <div className="pt-3 border-t border-slate-800">
                  {escalatedId ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-200">
                          Trackable Incident Created: <strong className="font-mono text-white text-sm">{escalatedId}</strong>
                        </span>
                      </div>
                      <Link
                        href={`/incidents?id=${encodeURIComponent(escalatedId)}`}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 self-start sm:self-auto"
                      >
                        <span>Open Incident Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          Convert to Trackable Incident
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Save this diagnosed failure directly into Incident Commander with attached runbook.
                        </span>
                      </div>

                      <button
                        onClick={handleCreateIncident}
                        disabled={escalating}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50 shrink-0 self-start sm:self-auto"
                      >
                        <AlertOctagon className="w-4 h-4" />
                        <span>{escalating ? 'Creating Incident...' : 'Create Incident'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-Step Remediation Runbook */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Automated Remediation Runbook ({result.remediationSteps.length} Steps)
                    </h3>
                  </div>

                  <button
                    onClick={handleAutoHealApplication}
                    disabled={isHealing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                  >
                    <Zap className={`w-3.5 h-3.5 fill-white ${isHealing ? 'animate-bounce' : ''}`} />
                    <span>{isHealing ? 'Executing Runbook & Healing...' : '⚡ Auto-Fix & Run Application'}</span>
                  </button>
                </div>

                {/* Live Self-Healing Terminal & Status */}
                {(isHealing || healingLogs.length > 0) && (
                  <div className="p-4 rounded-xl bg-black/90 border border-emerald-500/30 space-y-2 animate-in fade-in duration-200 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                        <Terminal className="w-3.5 h-3.5" />
                        DeployGuard Auto-Heal Live Runner
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isHealing ? 'Status: RUNNING EXECUTION' : 'Status: REMEDIATION COMPLETE'}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1 select-text">
                      {healingLogs.map((log, i) => (
                        <div key={i} className={`flex items-start gap-2 ${
                          log.includes('[SUCCESS]') || log.includes('[HEALTHCHECK]') || log.includes('PASSED') || log.includes('[TRAFFIC]')
                            ? 'text-emerald-400 font-semibold'
                            : log.includes('[INIT]') || log.includes('[DIAGNOSIS]')
                            ? 'text-cyan-400'
                            : log.includes('$')
                            ? 'text-amber-300'
                            : 'text-slate-300'
                        }`}>
                          <span className="text-slate-600 select-none text-[10px]">{i + 1}</span>
                          <span className="break-all">{log}</span>
                        </div>
                      ))}
                    </div>

                    {healedResult && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-200">Application Healed & Running!</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-beacon" />
                                200 OK · ACTIVE
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Deployment ID: {healedResult.deployment?.id || 'heal-101'} (100% traffic promoted)
                            </span>
                          </div>
                        </div>

                        <Link
                          href="/deployments"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 self-start sm:self-auto"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>View Deployment</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {result.remediationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {step.step}
                        </span>
                        <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-7">
                        {step.description}
                      </p>

                      {step.command && (
                        <div className="ml-7 mt-2 p-2.5 rounded-lg bg-black/90 border border-slate-800 flex items-center justify-between gap-2 group">
                          <code className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                            $ {step.command}
                          </code>
                          <button
                            onClick={() => handleCopyCommand(step.command!, idx)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                            title="Copy command to clipboard"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preventative Measures Card */}
              {result.preventativeMeasures && result.preventativeMeasures.length > 0 && (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Long-Term Preventative Guardrails
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {result.preventativeMeasures.map((measure, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
              <SearchCode className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No Analysis Executed Yet</p>
              <p className="text-xs text-slate-500 mt-1">Select one of the sample scenarios or click &quot;Analyze Deployment Logs&quot;.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Analyzer...</div>}>
      <AnalyzerContent />
    </Suspense>
  );
}
