export type DeploymentStatus = 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'ROLLING_BACK' | 'ROLLED_BACK';

export type Environment = 'production' | 'staging' | 'development';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'INVESTIGATING' | 'MITIGATED';

export type FailureCategory = 
  | 'INFRASTRUCTURE'
  | 'DATABASE'
  | 'NETWORK'
  | 'CONFIGURATION'
  | 'DEPENDENCY'
  | 'SECURITY'
  | 'APPLICATION';

export interface PipelineStage {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs?: number;
  logs?: string[];
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Deployment {
  id: string;
  serviceName: string;
  environment: Environment;
  version: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  status: DeploymentStatus;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  trigger: 'GITHUB_ACTIONS' | 'MANUAL_CLI' | 'SCHEDULED' | 'ROLLBACK';
  stages: PipelineStage[];
  rawLogs: string;
  failureReason?: string;
  incidentId?: string;
  rollbackVersion?: string;
}

export interface RemediationStep {
  step: number;
  title: string;
  description: string;
  command?: string;
  verificationCommand?: string;
}

export interface AnalysisResult {
  signatureId: string;
  ruleName: string;
  category: FailureCategory;
  severity: Severity;
  confidenceScore: number; // 0 - 100
  summary: string;
  rootCause: string;
  detectedPattern: string;
  affectedComponent: string;
  remediationSteps: RemediationStep[];
  preventativeMeasures: string[];
  docLinks?: { label: string; url: string }[];
  matchedLines?: { lineNumber: number; content: string }[];
  analysisEngine: 'RULE_ENGINE_LOCAL' | 'GEMINI_AI_ASSIST';
  analyzedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  error?: string;
  serviceName: string;
  environment: Environment;
  severity: Severity;
  status: IncidentStatus;
  deploymentId: string;
  rootCause: string;
  category: FailureCategory;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  recommendedSolution?: string;
  remediationSteps?: RemediationStep[];
  rawLogs?: string;
  timeline: {
    timestamp: string;
    message: string;
    author: string;
  }[];
  postMortem?: {
    summary: string;
    impactDurationMinutes: number;
    affectedUsersApprox: string;
    actionItems: string[];
    lessonsLearned: string[];
  };
}

export interface SystemMetrics {
  totalDeployments: number;
  successRate: number;
  failedDeployments: number;
  activeIncidents: number;
  meanTimeToRecoveryMinutes: number;
  categoryBreakdown: Record<FailureCategory, number>;
  environmentBreakdown: Record<Environment, { total: number; failed: number }>;
  recentFailureRateTrend: { date: string; success: number; failed: number }[];
}

export interface SampleLogPreset {
  id: string;
  title: string;
  service: string;
  category: FailureCategory;
  description: string;
  logContent: string;
}
