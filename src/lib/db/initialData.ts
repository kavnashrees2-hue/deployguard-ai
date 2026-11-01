import { Deployment, Incident } from '../types';

export const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep-901',
    serviceName: 'recommendation-worker',
    environment: 'production',
    version: 'v3.4.1',
    commitHash: '7b8f9c2',
    commitMessage: 'feat(vectors): load high dimensional embeddings into memory',
    author: 'alex.chen',
    status: 'FAILED',
    startedAt: '2026-10-20T10:13:30.000Z',
    completedAt: '2026-10-20T10:14:25.000Z',
    durationSeconds: 55,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'Kubernetes Pod Out-Of-Memory (OOMKilled, Exit Code 137)',
    incidentId: 'INC-001',
    rawLogs: `2026-10-20T10:14:02.112Z [INFO] Initializing RecommendationWorker v3.4.1...
2026-10-20T10:14:05.890Z [INFO] Connecting to Redis Cache at redis-cluster.internal:6379... Connected.
2026-10-20T10:14:08.204Z [INFO] Loading embedding tensor vectors into heap memory (500,000 items)...
2026-10-20T10:14:15.342Z [WARN] Heap usage reaching threshold: 462MB / 512MB limit allocated.
2026-10-20T10:14:18.901Z [INFO] Processing batch chunk #442...
2026-10-20T10:14:21.055Z kernel: [12948.330192] Memory cgroup out of memory: Kill process 42109 (node) score 982 or sacrifice child
2026-10-20T10:14:21.056Z kernel: [12948.330201] Killed process 42109 (node) total-vm:1894432kB, anon-rss:524288kB, file-rss:0kB
2026-10-20T10:14:21.410Z kubelet: Container recommendation-worker in pod recommendation-api-7b8f9c-v9xk2 was terminated. Reason: OOMKilled, Exit Code: 137
2026-10-20T10:14:21.411Z kubelet: Pod memory limit exceeded (limits.memory: 512Mi).
2026-10-20T10:14:25.000Z Error: Process completed with exit code 137.`,
    stages: [
      { id: 's1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 4200 },
      { id: 's2', name: 'Unit Tests', status: 'PASSED', durationMs: 8400 },
      { id: 's3', name: 'Docker Build & Push', status: 'PASSED', durationMs: 24100 },
      { id: 's4', name: 'Kubernetes Rollout', status: 'PASSED', durationMs: 6500 },
      { id: 's5', name: 'Liveness / Healthcheck Probe', status: 'FAILED', durationMs: 11800, errorMessage: 'Pod terminated: OOMKilled (Exit Code 137)' }
    ]
  },
  {
    id: 'dep-902',
    serviceName: 'billing-transaction-worker',
    environment: 'production',
    version: 'v2.8.0',
    commitHash: '3a4f10e',
    commitMessage: 'perf(workers): increase concurrency to 8 workers per pod',
    author: 'sarah.jenkins',
    status: 'FAILED',
    startedAt: '2026-10-20T09:44:00.000Z',
    completedAt: '2026-10-20T09:45:17.000Z',
    durationSeconds: 77,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'PostgreSQL Connection Pool Exhaustion (FATAL: remaining connection slots reserved)',
    incidentId: 'INC-002',
    rawLogs: `2026-10-20T09:45:10.002Z [INFO] BillingWorker spinning up 8 concurrency workers...
2026-10-20T09:45:11.231Z [INFO] Subscribed to queue "billing.invoices.process"
2026-10-20T09:45:14.502Z [WARN] Pool connection acquisition taking longer than usual (4200ms)...
2026-10-20T09:45:16.890Z [ERROR] PrismaClientInitializationError: Can't reach database server at rds-aurora-postgres.internal:5432
FATAL: remaining connection slots are reserved for non-replication superuser connections
2026-10-20T09:45:17.104Z [FATAL] Timeout waiting for connection from pool after 10000ms. Connection pool is full (size: 100/100).`,
    stages: [
      { id: 's1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 3100 },
      { id: 's2', name: 'Unit Tests', status: 'PASSED', durationMs: 6200 },
      { id: 's3', name: 'Docker Build & Push', status: 'PASSED', durationMs: 22000 },
      { id: 's4', name: 'Kubernetes Rollout', status: 'PASSED', durationMs: 5800 },
      { id: 's5', name: 'DB Connection Warmup', status: 'FAILED', durationMs: 39900, errorMessage: 'PostgreSQL max_connections reached' }
    ]
  },
  {
    id: 'dep-903',
    serviceName: 'user-profile-service',
    environment: 'staging',
    version: 'v1.19.4',
    commitHash: 'c90e118',
    commitMessage: 'feat(auth): add biometric credential tables',
    author: 'priya.sharma',
    status: 'FAILED',
    startedAt: '2026-10-20T11:01:00.000Z',
    completedAt: '2026-10-20T11:03:38.000Z',
    durationSeconds: 158,
    trigger: 'MANUAL_CLI',
    failureReason: 'Database Migration Advisory Lock Timeout on table schema_migrations',
    incidentId: 'INC-003',
    rawLogs: `2026-10-20T11:02:15.110Z [CI-STAGE: db:migrate] Running database schema migration...
2026-10-20T11:02:16.004Z Prisma schema loaded from prisma/schema.prisma
2026-10-20T11:02:17.410Z Applying migration 20261020110000_add_user_biometric_credentials...
2026-10-20T11:03:37.500Z Error: P3005: The database schema is locked for migrations.
Timed out waiting for lock on table "schema_migrations".`,
    stages: [
      { id: 's1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 2900 },
      { id: 's2', name: 'Database Migration', status: 'FAILED', durationMs: 142000, errorMessage: 'Advisory lock timeout on schema_migrations' },
      { id: 's3', name: 'Docker Build', status: 'SKIPPED' },
      { id: 's4', name: 'Staging Deploy', status: 'SKIPPED' }
    ]
  },
  {
    id: 'dep-904',
    serviceName: 'auth-service',
    environment: 'production',
    version: 'v4.1.0',
    commitHash: 'e51b2a9',
    commitMessage: 'fix(oauth): support refresh token revocation',
    author: 'marcus.vance',
    status: 'SUCCESS',
    startedAt: '2026-10-20T08:30:00.000Z',
    completedAt: '2026-10-20T08:32:15.000Z',
    durationSeconds: 135,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `2026-10-20T08:30:10.000Z [INFO] Pipeline started for branch main.
2026-10-20T08:30:45.000Z [INFO] All 48 unit and integration tests passed.
2026-10-20T08:31:30.000Z [INFO] Image built and pushed to ECR: 92837482.dkr.ecr.us-east-1.amazonaws.com/auth-service:v4.1.0
2026-10-20T08:32:00.000Z [INFO] Kubernetes deployment successfully rolled out 4/4 pods.
2026-10-20T08:32:15.000Z [INFO] Canary health probes 100% successful. Traffic promoted.`,
    stages: [
      { id: 's1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 3800 },
      { id: 's2', name: 'Automated Tests', status: 'PASSED', durationMs: 35000 },
      { id: 's3', name: 'Container Build', status: 'PASSED', durationMs: 45000 },
      { id: 's4', name: 'Canary Rollout', status: 'PASSED', durationMs: 30000 },
      { id: 's5', name: 'Health Probe & Promotion', status: 'PASSED', durationMs: 21200 }
    ]
  },
  {
    id: 'dep-905',
    serviceName: 'api-gateway-edge',
    environment: 'production',
    version: 'v1.12.2',
    commitHash: '4f66a21',
    commitMessage: 'chore(deps): update envoy proxy core image to 1.30.2',
    author: 'devops-bot',
    status: 'ROLLED_BACK',
    startedAt: '2026-10-20T05:15:00.000Z',
    completedAt: '2026-10-20T05:22:10.000Z',
    durationSeconds: 430,
    trigger: 'ROLLBACK',
    rollbackVersion: 'v1.12.1',
    failureReason: 'TLS handshake failure due to expired certificate challenge',
    rawLogs: `2026-10-20T05:17:00.000Z [CRIT] Client TLS Connection Aborted: CERT_HAS_EXPIRED
2026-10-20T05:18:10.000Z [ALERT] Automatic rollback triggered to target version v1.12.1
2026-10-20T05:22:10.000Z [INFO] Rollback completed. Traffic healthy.`,
    stages: [
      { id: 's1', name: 'Canary Ingress', status: 'FAILED', durationMs: 45000, errorMessage: 'Cert expired error' },
      { id: 's2', name: 'Auto-Rollback to v1.12.1', status: 'PASSED', durationMs: 210000 }
    ]
  },
  {
    id: 'dep-906',
    serviceName: 'frontend-cdn-web',
    environment: 'production',
    version: 'v5.9.0',
    commitHash: '8d20fa4',
    commitMessage: 'feat(ui): deploy new checkout flow v2',
    author: 'lisa.wong',
    status: 'SUCCESS',
    startedAt: '2026-10-19T22:10:00.000Z',
    completedAt: '2026-10-19T22:13:00.000Z',
    durationSeconds: 180,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `2026-10-19T22:11:00.000Z [INFO] Static assets compiled and purged on Cloudflare CDN.
2026-10-19T22:13:00.000Z [INFO] Deployment completed with 0 errors.`,
    stages: [
      { id: 's1', name: 'Next.js Build', status: 'PASSED', durationMs: 78000 },
      { id: 's2', name: 'CDN Cache Purge', status: 'PASSED', durationMs: 45000 }
    ]
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-001',
    title: 'Kubernetes Pod Out-Of-Memory (OOMKilled)',
    error: 'Kubernetes OOMKilled',
    serviceName: 'recommendation-worker',
    environment: 'production',
    severity: 'CRITICAL',
    status: 'OPEN',
    deploymentId: 'dep-901',
    category: 'INFRASTRUCTURE',
    rootCause: 'Memory limit exceeded (512Mi limit exceeded during vector matrix init)',
    recommendedSolution: 'Increase memory requests and limits from 512Mi to 1.5Gi in deployment manifest',
    assignee: 'alex.chen',
    createdAt: '2026-10-20T10:14:25.000Z',
    updatedAt: '2026-10-20T10:20:00.000Z',
    remediationSteps: [
      {
        step: 1,
        title: 'Inspect pod termination reason and memory usage',
        description: 'Verify the container exit code (137) and check live memory usage against pod cgroup allocations.',
        command: 'kubectl describe pod recommendation-worker-7b8f9c -n production | grep -E "Exit Code|OOMKilled|Limits"',
        verificationCommand: 'kubectl top pod -n production'
      },
      {
        step: 2,
        title: 'Check whether the application has a memory leak',
        description: 'Examine previous stdout/stderr logs for uncollected heap allocations, unbounded caches, or buffer leaks.',
        command: 'kubectl logs recommendation-worker-7b8f9c -n production --previous --tail=100 | grep -iE "heap|leak|allocation"'
      },
      {
        step: 3,
        title: 'Recommend suitable memory requests and limits',
        description: 'Increase pod memory limits and requests to provide sufficient headroom (e.g. from 512Mi to 1.5Gi).',
        command: 'kubectl set resources deployment recommendation-worker --limits=memory=1.5Gi --requests=memory=768Mi -n production'
      },
      {
        step: 4,
        title: 'Suggest checking Node.js/JVM heap settings',
        description: 'Align runtime memory heap thresholds with container cgroup limits so garbage collector kicks in before kernel OOM.',
        command: 'export NODE_OPTIONS="--max-old-space-size=1200"'
      },
      {
        step: 5,
        title: 'Verify whether the issue is resolved after redeployment',
        description: 'Monitor the rollout to ensure new replica pods become 1/1 READY without CrashLoopBackOff.',
        command: 'kubectl rollout status deployment/recommendation-worker -n production && kubectl top pods -n production'
      }
    ],
    timeline: [
      {
        timestamp: '2026-10-20T10:14:25.000Z',
        message: 'Incident triggered automatically by DeployGuard AI upon detecting Exit Code 137 (OOMKilled).',
        author: 'DeployGuard System'
      },
      {
        timestamp: '2026-10-20T10:16:10.000Z',
        message: 'Assigned to Alex Chen. Staging replication confirmed 500k embedding items require ~1.2Gi heap.',
        author: 'alex.chen'
      },
      {
        timestamp: '2026-10-20T10:20:00.000Z',
        message: 'Preparing hotfix PR to update pod limits to 1.5Gi and configure streaming tensor loads.',
        author: 'alex.chen'
      }
    ],
    postMortem: {
      summary: 'Recommendation engine pods were killed immediately after rollout due to insufficient memory limits when vector caches were pre-warmed.',
      impactDurationMinutes: 18,
      affectedUsersApprox: '14,200 requests degraded to fallback ranking',
      actionItems: [
        'Increase container memory limits from 512Mi to 1.5Gi in deployment spec',
        'Add load-testing stage with full embeddings dataset in CI staging pipeline',
        'Configure Prometheus memory alert rule at 85% threshold'
      ],
      lessonsLearned: [
        'Synthetic unit tests with small mock datasets failed to reveal actual tensor memory footprint.',
        'Production memory limits must be sized with 30% safety headroom over peak heap.'
      ]
    }
  },
  {
    id: 'INC-002',
    title: 'PostgreSQL RDS Connection Pool Exhaustion',
    error: 'FATAL: remaining connection slots are reserved',
    serviceName: 'billing-transaction-worker',
    environment: 'production',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    deploymentId: 'dep-902',
    category: 'DATABASE',
    rootCause: 'Deploying 8 concurrent workers across 5 pods exhausted the 100 connection max limit on Postgres.',
    recommendedSolution: 'Deploy PgBouncer connection proxy and limit max pool connections per pod.',
    assignee: 'sarah.jenkins',
    createdAt: '2026-10-20T09:45:17.000Z',
    updatedAt: '2026-10-20T10:05:00.000Z',
    remediationSteps: [
      {
        step: 1,
        title: 'Terminate idle-in-transaction connection leaks',
        description: 'Terminate inactive blocking connections holding connection slots.',
        command: "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - INTERVAL '5 minutes';"
      },
      {
        step: 2,
        title: 'Dial back worker replica count',
        description: 'Scale down billing-transaction-worker to 2 replicas while connection pooling proxy is prepared.',
        command: 'kubectl scale deployment billing-transaction-worker --replicas=2 -n production'
      },
      {
        step: 3,
        title: 'Enforce connection pool limit formula per pod',
        description: 'Configure pool max size = (2 * CPU_CORES) + 1 per pod instance in connection string.',
        command: 'kubectl set env deployment/billing-transaction-worker DATABASE_POOL_MAX=4 -n production'
      }
    ],
    timeline: [
      {
        timestamp: '2026-10-20T09:45:17.000Z',
        message: 'DeployGuard detected Prisma connection pool timeout and FATAL: remaining connection slots.',
        author: 'DeployGuard System'
      },
      {
        timestamp: '2026-10-20T09:50:00.000Z',
        message: 'Terminated idle-in-transaction connections and dialed back replica count to 2 pods.',
        author: 'sarah.jenkins'
      },
      {
        timestamp: '2026-10-20T10:05:00.000Z',
        message: 'Connection saturation mitigated. Deploying PgBouncer connection proxy in next window.',
        author: 'sarah.jenkins'
      }
    ],
    postMortem: {
      summary: 'Concurrency increase combined with horizontal auto-scaling opened 160 connections against a database limit of 100.',
      impactDurationMinutes: 20,
      affectedUsersApprox: '320 invoice webhook notifications delayed',
      actionItems: [
        'Enforce connection pool limit formula per pod: connection_limit = 4',
        'Deploy AWS RDS Proxy / PgBouncer to multiplex client connections',
        'Add CloudWatch alarm for DatabaseConnections > 80'
      ],
      lessonsLearned: [
        'Total connection pool capacity must be audited prior to scaling pod replicas.'
      ]
    }
  },
  {
    id: 'INC-003',
    title: 'Database Schema Migration Advisory Lock Conflict',
    error: 'Database Migration Lock',
    serviceName: 'user-profile-service',
    environment: 'staging',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    deploymentId: 'dep-903',
    category: 'DATABASE',
    rootCause: 'Cancelled GitHub Action workflow left Postgres pg_advisory_lock unreleased.',
    recommendedSolution: 'Release lock via pg_terminate_backend and re-run migration with timeout parameter.',
    resolution: 'Terminated orphan advisory lock using pg_terminate_backend and applied migration timeout parameter.',
    assignee: 'priya.sharma',
    createdAt: '2026-10-20T11:03:38.000Z',
    updatedAt: '2026-10-20T11:25:00.000Z',
    resolvedAt: '2026-10-20T11:25:00.000Z',
    remediationSteps: [
      {
        step: 1,
        title: 'Inspect active PostgreSQL advisory lock holder',
        description: 'Find the PID holding the migration advisory lock on Postgres.',
        command: "SELECT pid, locktype, mode, granted FROM pg_locks WHERE locktype = 'advisory';"
      },
      {
        step: 2,
        title: 'Terminate orphan migration session',
        description: 'Kill the zombie session left behind by the aborted pipeline runner.',
        command: 'SELECT pg_terminate_backend(<pid>);'
      },
      {
        step: 3,
        title: 'Re-trigger staging schema migration with lock timeout',
        description: 'Execute Prisma migrate deploy with lock_timeout set to 30s to prevent pipeline hangs.',
        command: 'npx prisma migrate deploy'
      }
    ],
    timeline: [
      {
        timestamp: '2026-10-20T11:03:38.000Z',
        message: 'Migration lock acquisition timed out after 120s.',
        author: 'DeployGuard System'
      },
      {
        timestamp: '2026-10-20T11:15:00.000Z',
        message: 'Cleared orphan advisory lock using pg_terminate_backend.',
        author: 'priya.sharma'
      },
      {
        timestamp: '2026-10-20T11:25:00.000Z',
        message: 'Re-ran migration successfully. Staging environment restored.',
        author: 'priya.sharma'
      }
    ]
  }
];
