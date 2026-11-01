import { DeploymentStatus, Environment, FailureCategory, Severity, IncidentStatus } from './types';

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  } catch {
    return 'Recently';
  }
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${mins}m ${remainingSecs}s`;
}

export function getStatusBadge(status: DeploymentStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  pulse?: boolean;
} {
  switch (status) {
    case 'SUCCESS':
      return { label: 'Healthy', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'FAILED':
      return { label: 'Failed', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'IN_PROGRESS':
      return { label: 'Deploying', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', pulse: true };
    case 'ROLLING_BACK':
      return { label: 'Rolling Back', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', pulse: true };
    case 'ROLLED_BACK':
      return { label: 'Rolled Back', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
    default:
      return { label: status, bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export function getSeverityBadge(severity: Severity): {
  bg: string;
  text: string;
  border: string;
} {
  switch (severity) {
    case 'CRITICAL':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' };
    case 'HIGH':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' };
    case 'MEDIUM':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'LOW':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' };
  }
}

export function getIncidentStatusBadge(status: IncidentStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'OPEN':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' };
    case 'IN_PROGRESS':
    case 'INVESTIGATING':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'MITIGATED':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' };
    case 'RESOLVED':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
  }
}

export function getCategoryBadge(category: FailureCategory): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case 'INFRASTRUCTURE':
      return { label: 'Infra / K8s', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'DATABASE':
      return { label: 'Database', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' };
    case 'NETWORK':
      return { label: 'Network', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'CONFIGURATION':
      return { label: 'Config / Env', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'DEPENDENCY':
      return { label: 'Dependencies', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'SECURITY':
      return { label: 'Security / IAM', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    case 'APPLICATION':
      return { label: 'Application', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }
}

export function getEnvironmentBadge(env: Environment): {
  bg: string;
  text: string;
  border: string;
} {
  switch (env) {
    case 'production':
      return { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30' };
    case 'staging':
      return { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' };
    case 'development':
      return { bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30' };
  }
}
