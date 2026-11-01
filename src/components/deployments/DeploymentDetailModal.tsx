'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Deployment } from '@/lib/types';
import { getStatusBadge, getEnvironmentBadge, formatDate, formatDuration } from '@/lib/utils';
import { 
  X, 
  GitCommit, 
  User, 
  Clock, 
  RotateCcw, 
  SearchCode, 
  Copy, 
  Check, 
  Terminal, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface DeploymentDetailModalProps {
  deployment: Deployment | null;
  onClose: () => void;
  onRollbackComplete?: () => void;
}

export default function DeploymentDetailModal({
  deployment,
  onClose,
  onRollbackComplete
}: DeploymentDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  if (!deployment) return null;

  const status = getStatusBadge(deployment.status);
  const env = getEnvironmentBadge(deployment.environment);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(deployment.rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRollback = async () => {
    try {
      setRollingBack(true);
      const res = await fetch(`/api/deployments/${deployment.id}/rollback`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setRollbackSuccess(data.data?.rollbackVersion || 'v1.0.0-stable');
        if (onRollbackComplete) onRollbackComplete();
      }
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white">{deployment.serviceName}</h2>
              <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {deployment.version}
              </span>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${env.bg} ${env.text} ${env.border}`}>
                {deployment.environment}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.bg} ${status.text} ${status.border} flex items-center gap-1.5`}>
                {status.pulse && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-beacon" />}
                {status.label}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
              <span>{deployment.commitMessage}</span>
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                {deployment.commitHash}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {deployment.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(deployment.startedAt)} ({formatDuration(deployment.durationSeconds)})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Failure Alert Banner (if failed) */}
          {deployment.status === 'FAILED' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-200">Deployment Failure Detected</h4>
                <p className="text-xs text-rose-300/90 mt-1">
                  {deployment.failureReason || 'Process exited with non-zero exit code during pipeline execution.'}
                </p>
              </div>

              <Link
                href={`/analyzer?service=${encodeURIComponent(deployment.serviceName)}&log=${encodeURIComponent(deployment.rawLogs)}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-indigo-600/30"
              >
                <SearchCode className="w-3.5 h-3.5" />
                <span>AI Triage</span>
              </Link>
            </div>
          )}

          {/* Rollback Success Banner */}
          {rollbackSuccess && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-purple-200">Rollback Successfully Executed</h4>
                <p className="text-xs text-purple-300/90 mt-0.5">
                  Service reverted to verified stable image: <span className="font-mono font-bold">{rollbackSuccess}</span>
                </p>
              </div>
            </div>
          )}

          {/* Pipeline Stages Visualizer */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Pipeline Stage Execution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {deployment.stages?.map((stage, idx) => {
                const isPassed = stage.status === 'PASSED';
                const isFailed = stage.status === 'FAILED';
                const isRunning = stage.status === 'RUNNING';

                return (
                  <div
                    key={stage.id || idx}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                      isPassed
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                        : isFailed
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                        : isRunning
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 animate-pulse'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-400">0{idx + 1}</span>
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isFailed ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : isRunning ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-beacon" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <span className="font-semibold text-slate-200 truncate">{stage.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      {stage.durationMs ? `${(stage.durationMs / 1000).toFixed(1)}s` : stage.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Log Output Inspector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Raw Execution Stream Logs
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Logs</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/analyzer?service=${encodeURIComponent(deployment.serviceName)}&log=${encodeURIComponent(deployment.rawLogs)}`}
                  className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <SearchCode className="w-3 h-3" />
                  <span>Analyze in Tool</span>
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/90 border border-slate-800 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto space-y-1 select-text">
              {deployment.rawLogs.split('\n').map((line, i) => {
                const isError = line.toLowerCase().includes('error') || 
                                line.toLowerCase().includes('fatal') || 
                                line.toLowerCase().includes('killed') || 
                                line.toLowerCase().includes('failed');
                const isWarn = line.toLowerCase().includes('warn');

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 py-0.5 ${
                      isError
                        ? 'text-rose-400 bg-rose-500/10 px-1 rounded font-medium'
                        : isWarn
                        ? 'text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-7 shrink-0 text-slate-600 select-none text-right text-[11px]">{i + 1}</span>
                    <span className="break-all">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Deployment ID: {deployment.id}
          </span>

          <div className="flex items-center gap-3">
            {deployment.status === 'FAILED' && !rollbackSuccess && (
              <button
                onClick={handleRollback}
                disabled={rollingBack}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${rollingBack ? 'animate-spin' : ''}`} />
                <span>{rollingBack ? 'Triggering Rollback...' : 'Trigger Auto-Rollback'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
