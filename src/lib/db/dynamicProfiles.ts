import { Deployment, Incident, FailureCategory, Environment } from '../types';
import { INITIAL_DEPLOYMENTS, INITIAL_INCIDENTS } from './initialData';

export interface SampleProfileMeta {
  id: string;
  name: string;
  description: string;
  badge: string;
}

export const SAMPLE_PROFILES: SampleProfileMeta[] = [
  {
    id: 'default',
    name: 'Default E-Commerce Fleet',
    description: 'Recommendation worker OOM crash, billing DB connection pool lock, and healthy frontend rollouts.',
    badge: 'Baseline'
  },
  {
    id: 'fintech_outage',
    name: 'High-Volume Fintech Outage',
    description: 'Fraud engine cgroup memory kill, ledger serializable deadlock, and stripe webhook port conflict.',
    badge: 'Fintech'
  },
  {
    id: 'multicloud_cascade',
    name: 'Multi-Cloud Cascading Disaster',
    description: 'Kafka partition split-brain leader offline, expired wildcard TLS cert, and search cluster shards unassigned.',
    badge: 'Multi-Cloud'
  },
  {
    id: 'ai_cluster',
    name: 'AI/LLM Serving Cluster Outage',
    description: 'CUDA GPU VRAM out-of-memory in vLLM, Pinecone vector dimension mismatch, and upstream rate limits.',
    badge: 'AI / LLM'
  },
  {
    id: 'random',
    name: '🎲 Dynamic Random SRE Generator',
    description: 'Fresh dynamic timestamps, randomized microservices, varied failure logs, and unpredictable incident tickets every time!',
    badge: 'Dynamic'
  }
];

export const FINTECH_DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep-ft-101',
    serviceName: 'fraud-detection-engine',
    environment: 'production',
    version: 'v4.1.2',
    commitHash: '9a31b4e',
    commitMessage: 'feat(scoring): batch ingest 250k high-risk credit transactions into memory array',
    author: 'elena.rostova',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'Kubernetes Pod Out-Of-Memory (OOMKilled, Exit Code 137)',
    incidentId: 'INC-FT-001',
    rawLogs: `[INFO] Initializing FraudDetectionEngine v4.1.2 on PyTorch runtime...
[INFO] Loading high-throughput credit settlement buffer (batch_size=250000)...
[WARN] Resident memory allocation surged from 512MB to 1980MB in 8.4 seconds.
[ALERT] cgroup memory threshold reached: 2048MiB allocated / 2048MiB max limit.
kernel: [49812.1120] Memory cgroup out of memory: Killed process 8192 (python3) score 992.
kubelet: Pod fraud-detection-engine-7d9f-xk81 terminated with exit code 137 (OOMKilled).
Error: Container crashed with exit code 137.`,
    stages: [
      { id: 's1', name: 'Lint & Model Validation', status: 'PASSED', durationMs: 4100 },
      { id: 's2', name: 'PyTest Suite', status: 'PASSED', durationMs: 12000 },
      { id: 's3', name: 'Container Image Push', status: 'PASSED', durationMs: 31000 },
      { id: 's4', name: 'Cluster Deployment', status: 'PASSED', durationMs: 8000 },
      { id: 's5', name: 'Liveness Probe', status: 'FAILED', durationMs: 14000, errorMessage: 'Pod terminated: OOMKilled (Exit Code 137)' }
    ]
  },
  {
    id: 'dep-ft-102',
    serviceName: 'payment-ledger-sync',
    environment: 'production',
    version: 'v2.6.0',
    commitHash: '8b42c19',
    commitMessage: 'fix(ledger): force serializable isolation on nightly balance reconciliation',
    author: 'marcus.vance',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    durationSeconds: 180,
    trigger: 'SCHEDULED',
    failureReason: 'PostgreSQL Database Deadlock (40P01 deadlock detected)',
    incidentId: 'INC-FT-002',
    rawLogs: `[INFO] Executing nightly ledger rollup for 42 corporate accounts...
[INFO] BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
[WARN] Query Lock acquisition blocked on relation 'account_balances' by PID 14021.
[ERROR] PostgreSQL error 40P01: deadlock detected
DETAIL: Process 14021 waits for ExclusiveLock on relation account_balances; blocked by process 14033.
Process 14033 waits for ShareLock on relation ledger_entries; blocked by process 14021.
HINT: See server log for query details.
FATAL: transaction aborted due to concurrent serialization failure.`,
    stages: [
      { id: 's1', name: 'Schema Migration Dry-Run', status: 'PASSED', durationMs: 3200 },
      { id: 's2', name: 'Database Rollout', status: 'FAILED', durationMs: 28000, errorMessage: 'PostgreSQL error 40P01: deadlock detected' }
    ]
  },
  {
    id: 'dep-ft-103',
    serviceName: 'stripe-webhook-proxy',
    environment: 'production',
    version: 'v1.9.4',
    commitHash: '4f9110a',
    commitMessage: 'feat(webhooks): bind dedicated SSL TLS port 8443 for direct charge notification stream',
    author: 'nathan.drake',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 49).toISOString(),
    durationSeconds: 60,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'Port Collision (Error: listen EADDRINUSE: address already in use :::8443)',
    incidentId: 'INC-FT-003',
    rawLogs: `[INFO] Starting Stripe Webhook Ingress Daemon on port 8443...
[ERROR] Uncaught Exception: Error: listen EADDRINUSE: address already in use :::8443
    at Server.setupListenHandle [as _listen2] (node:net:1800:16)
    at listenInCluster (node:net:1848:12)
    at Server.listen (node:net:1936:7)
[FATAL] Socket initialization failure: port 8443 is occupied by rogue daemon PID 2911. Process exiting with code 1.`,
    stages: [
      { id: 's1', name: 'Security Audit', status: 'PASSED', durationMs: 2100 },
      { id: 's2', name: 'Socket Binding Test', status: 'FAILED', durationMs: 4000, errorMessage: 'listen EADDRINUSE: address already in use :::8443' }
    ]
  },
  {
    id: 'dep-ft-104',
    serviceName: 'kyc-identity-vault',
    environment: 'staging',
    version: 'v3.1.0',
    commitHash: '2b19cf8',
    commitMessage: 'feat(kyc): add automated passport checksum validation',
    author: 'alyssa.t',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 73).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `[INFO] Deploying KYC Identity Vault v3.1.0 to staging-us-east-1...
[INFO] Passport checksum algorithms validated: MRZ TD1, TD2, TD3 passed.
[INFO] Container rollout completed: 3/3 pods ready. Health probe 200 OK.`,
    stages: [
      { id: 's1', name: 'Unit Tests', status: 'PASSED', durationMs: 5100 },
      { id: 's2', name: 'Integration Tests', status: 'PASSED', durationMs: 14200 },
      { id: 's3', name: 'Canary Probe', status: 'PASSED', durationMs: 9000 }
    ]
  },
  {
    id: 'dep-ft-105',
    serviceName: 'customer-balance-cache',
    environment: 'production',
    version: 'v2.2.0',
    commitHash: '7a119c4',
    commitMessage: 'perf(redis): warm up active account cache on startup',
    author: 'marcus.vance',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 108).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `[INFO] Connecting to Redis Sentinel cluster... 3 master sentinels confirmed.
[INFO] Pre-warmed 50,000 balance cache keys in 2.1s. Cluster latency: 1.2ms. Status: HEALTHY.`,
    stages: [
      { id: 's1', name: 'Build', status: 'PASSED', durationMs: 4000 },
      { id: 's2', name: 'Rollout', status: 'PASSED', durationMs: 8000 }
    ]
  }
];

export const FINTECH_INCIDENTS: Incident[] = [
  {
    id: 'INC-FT-001',
    title: 'CRITICAL: Fraud Engine Cgroup Memory Starvation during Settlement Batch',
    serviceName: 'fraud-detection-engine',
    environment: 'production',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    deploymentId: 'dep-ft-101',
    rootCause: 'Batch size increased to 250k transactions without increasing pod cgroup memory limit from 2048Mi.',
    category: 'INFRASTRUCTURE',
    assignee: 'elena.rostova',
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    recommendedSolution: 'Increase memory limit to 4096Mi in k8s deployment spec or chunk transactions into 25k micro-batches.',
    remediationSteps: [
      { step: 1, title: 'Stop failing pods', command: 'kubectl scale deployment fraud-detection-engine --replicas=0', description: 'Stop failing pods from crashlooping' },
      { step: 2, title: 'Increase cgroup memory', command: 'kubectl set resources deployment fraud-detection-engine --limits=memory=4Gi', description: 'Double memory ceiling' },
      { step: 3, title: 'Scale back up', command: 'kubectl scale deployment fraud-detection-engine --replicas=4', description: 'Re-enable workload' }
    ],
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(), message: 'OOMKilled exit code 137 triggered by Linux kernel cgroup manager.', author: 'DeployGuard SRE Sentinel' }
    ]
  },
  {
    id: 'INC-FT-002',
    title: 'CRITICAL: Ledger Sync Serializable Deadlock on Transaction Rollup',
    serviceName: 'payment-ledger-sync',
    environment: 'production',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    deploymentId: 'dep-ft-102',
    rootCause: 'PostgreSQL deadlock detected between concurrent batch balance rollup and live webhook settlement transactions.',
    category: 'DATABASE',
    assignee: 'marcus.vance',
    createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    recommendedSolution: 'Acquire table locks in uniform order or switch isolation level to READ COMMITTED with optimistic row versioning.',
    remediationSteps: [
      { step: 1, title: 'Terminate stalled locks', command: 'SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = \'active\' AND wait_event_type = \'Lock\';', description: 'Terminate stalled locks' },
      { step: 2, title: 'Set query timeout', command: 'ALTER ROLE ledger_worker SET statement_timeout = \'5000\';', description: 'Prevent runaway locks' }
    ],
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(), message: 'Deadlock 40P01 detected. Automatic rollback initiated.', author: 'DeployGuard Database Guard' }
    ]
  }
];

export const MULTICLOUD_DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep-mc-201',
    serviceName: 'kafka-event-mesh',
    environment: 'production',
    version: 'v3.7.0',
    commitHash: '1c49b82',
    commitMessage: 'infra(kafka): adjust min.insync.replicas from 1 to 3 across AWS and Azure',
    author: 'vikram.patel',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    durationSeconds: 180,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'Kafka Broker Partition Under-Replicated (NotEnoughReplicasException)',
    incidentId: 'INC-MC-001',
    rawLogs: `[INFO] Applying Terraform plan for Kafka broker cluster (3 AWS brokers, 2 Azure brokers)...
[WARN] Network latency spike between us-east-1 and westeurope: 182ms.
[ERROR] org.apache.kafka.common.errors.NotEnoughReplicasException: Number of in-sync replicas 2 is less than configured minimum 3.
[FATAL] Producer cannot satisfy acks=all constraint. Topics locked: 'events.orders.v1', 'events.payments.v1'. Execution aborted.`,
    stages: [
      { id: 's1', name: 'Terraform Validate', status: 'PASSED', durationMs: 2500 },
      { id: 's2', name: 'Broker Health Check', status: 'FAILED', durationMs: 21000, errorMessage: 'NotEnoughReplicasException: min.insync.replicas violated' }
    ]
  },
  {
    id: 'dep-mc-202',
    serviceName: 'global-ingress-tls',
    environment: 'production',
    version: 'v1.4.1',
    commitHash: '7e221b0',
    commitMessage: 'security(tls): rotate wildcard leaf certificate for *.api.deployguard.io',
    author: 'clara.schmidt',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 43).toISOString(),
    durationSeconds: 120,
    trigger: 'SCHEDULED',
    failureReason: 'SSL/TLS Certificate Expired / Unmatched Private Key (x509: certificate has expired)',
    incidentId: 'INC-MC-002',
    rawLogs: `[INFO] Cert-Manager refreshing Secret "ingress-tls-wildcard"...
[WARN] ACME DNS-01 challenge timed out after 60s for domain *.api.deployguard.io.
[ERROR] tls: private key does not match public key in certificate secret.
[FATAL] x509: certificate has expired or is not yet valid (current date is past NotAfter 2026-10-31T23:59:59Z).
Ingress controller failed readiness probe on port 443.`,
    stages: [
      { id: 's1', name: 'ACME Challenge', status: 'FAILED', durationMs: 60000, errorMessage: 'x509: certificate has expired or key mismatch' }
    ]
  },
  {
    id: 'dep-mc-203',
    serviceName: 'clickhouse-analytics-ingest',
    environment: 'production',
    version: 'v23.8',
    commitHash: '3d90ab1',
    commitMessage: 'feat(olap): stream raw telemetry logs into ClickHouse MergeTree tables',
    author: 'vikram.patel',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 87).toISOString(),
    durationSeconds: 180,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `[INFO] Connected to ClickHouse 23.8 cluster (3 replicas).
[INFO] Schema validated: table 'telemetry_events' created with ORDER BY (timestamp, service_id). Health probe passed.`,
    stages: [
      { id: 's1', name: 'Schema Sync', status: 'PASSED', durationMs: 4500 },
      { id: 's2', name: 'Healthcheck', status: 'PASSED', durationMs: 3200 }
    ]
  }
];

export const MULTICLOUD_INCIDENTS: Incident[] = [
  {
    id: 'INC-MC-001',
    title: 'CRITICAL: Kafka Mesh Partition Split-Brain across us-east-1 and westeurope',
    serviceName: 'kafka-event-mesh',
    environment: 'production',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    deploymentId: 'dep-mc-201',
    rootCause: 'Cross-cloud latency exceeded broker heartbeat threshold, violating min.insync.replicas=3 constraint.',
    category: 'NETWORK',
    assignee: 'vikram.patel',
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    recommendedSolution: 'Revert min.insync.replicas to 2 until cross-cloud private interconnect latency stabilizes.',
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), message: 'Producer acks failed across all checkout topics.', author: 'DeployGuard Network SRE' }
    ]
  }
];

export const AI_CLUSTER_DEPLOYMENTS: Deployment[] = [
  {
    id: 'dep-ai-301',
    serviceName: 'vllm-serving-engine',
    environment: 'production',
    version: 'v0.6.2',
    commitHash: '5e81d09',
    commitMessage: 'feat(llm): increase kv-cache-dtype to fp16 with 8k context window',
    author: 'kai.nakamura',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'CUDA Out of Memory (torch.cuda.OutOfMemoryError: CUDA out of memory on GPU 0)',
    incidentId: 'INC-AI-001',
    rawLogs: `[INFO] Initializing vLLM engine with model: meta-llama/Llama-3-70B-Instruct-AWQ...
[INFO] Allocated 48.00 GiB for model weights on 2x NVIDIA H100 80GB GPUs.
[INFO] Attempting to pre-allocate KV cache for max_context=8192, max_num_seqs=256...
[ERROR] torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 38.40 GiB (GPU 0; 79.15 GiB total capacity; 58.20 GiB already allocated; 12.10 GiB free; 8.85 GiB reserved).
[FATAL] GPU VRAM allocation failed. Worker terminated with SIGABRT (Exit Code 134).`,
    stages: [
      { id: 's1', name: 'GPU Driver Check', status: 'PASSED', durationMs: 1200 },
      { id: 's2', name: 'Weights Pre-fetch', status: 'PASSED', durationMs: 45000 },
      { id: 's3', name: 'KV-Cache Allocation', status: 'FAILED', durationMs: 18000, errorMessage: 'CUDA out of memory: Tried to allocate 38.40 GiB on GPU 0' }
    ]
  },
  {
    id: 'dep-ai-302',
    serviceName: 'pinecone-vector-indexer',
    environment: 'production',
    version: 'v1.8.0',
    commitHash: '2c33a1f',
    commitMessage: 'feat(vectors): switch default embeddings to text-embedding-3-large',
    author: 'sophia.martinez',
    status: 'FAILED',
    startedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    failureReason: 'Vector Dimension Mismatch (PineconeBadRequestError: vector dimension 3072 does not match index dimension 1536)',
    incidentId: 'INC-AI-002',
    rawLogs: `[INFO] Ingesting enterprise document batch into Pinecone namespace "kb-production"...
[INFO] Generated 1,024 document vectors using model: text-embedding-3-large (dim=3072)...
[ERROR] PineconeBadRequestError: [Vector Dimension Mismatch]: Upsert failed.
Dimension of vector id 'doc_chunk_8410' is 3072, but target index 'deployguard-kb' has dimension 1536.
[FATAL] Bulk upsert rejected by vector database engine. Aborting pipeline.`,
    stages: [
      { id: 's1', name: 'Embeddings Generation', status: 'PASSED', durationMs: 8200 },
      { id: 's2', name: 'Vector Index Upsert', status: 'FAILED', durationMs: 3100, errorMessage: 'Vector dimension 3072 does not match index dimension 1536' }
    ]
  },
  {
    id: 'dep-ai-303',
    serviceName: 'rust-tokenizer-service',
    environment: 'production',
    version: 'v0.9.1',
    commitHash: '9d44c2a',
    commitMessage: 'perf: rewrite BPE tokenizer in Rust with zero-copy stream',
    author: 'kai.nakamura',
    status: 'SUCCESS',
    startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    durationSeconds: 120,
    trigger: 'GITHUB_ACTIONS',
    rawLogs: `[INFO] Rust BPE microservice online. Benchmarking 100,000 tokens: 1.4ms. Status: HEALTHY.`,
    stages: [
      { id: 's1', name: 'Cargo Test', status: 'PASSED', durationMs: 6400 },
      { id: 's2', name: 'Rollout', status: 'PASSED', durationMs: 4000 }
    ]
  }
];

export const AI_CLUSTER_INCIDENTS: Incident[] = [
  {
    id: 'INC-AI-001',
    title: 'CRITICAL: GPU VRAM Exhaustion in LLM Serving Cluster',
    serviceName: 'vllm-serving-engine',
    environment: 'production',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    deploymentId: 'dep-ai-301',
    rootCause: 'KV cache pre-allocation for 8k context window exceeded remaining 21GB headroom on GPU 0.',
    category: 'INFRASTRUCTURE',
    assignee: 'kai.nakamura',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    recommendedSolution: 'Set --gpu-memory-utilization 0.90 and configure --kv-cache-dtype fp8_e5m2 to halve cache footprint.',
    timeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), message: 'torch.cuda.OutOfMemoryError halted LLM model server.', author: 'DeployGuard AI SRE' }
    ]
  }
];

export function generateRandomDataset(): { deployments: Deployment[]; incidents: Incident[] } {
  const now = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const failureTypes = [
    {
      service: 'checkout-payment-gateway',
      reason: 'Kubernetes Pod Out-Of-Memory (OOMKilled, Exit Code 137)',
      logs: `kernel: Memory cgroup out of memory: Killed process node (score 988).\nkubelet: Pod checkout-payment-gateway terminated with OOMKilled (Exit Code 137).\nLimits: memory=512Mi exceeded.`,
      category: 'INFRASTRUCTURE' as FailureCategory,
      title: 'CRITICAL: Pod OOMKilled Exit 137 during Checkout Spike',
      fix: 'kubectl set resources deployment checkout-payment-gateway --limits=memory=1.5Gi'
    },
    {
      service: 'postgres-order-db',
      reason: 'Database Connection Pool Starvation (FATAL: remaining connection slots are reserved)',
      logs: `PrismaClientInitializationError: Connection pool is full (100/100 connections in use).\nFATAL: remaining connection slots are reserved for non-replication superuser connections.\nQuery timeout after 10000ms.`,
      category: 'DATABASE' as FailureCategory,
      title: 'CRITICAL: PostgreSQL Connection Pool Starvation on Primary Cluster',
      fix: 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state=\'idle in transaction\';'
    },
    {
      service: 'api-gateway-envoy',
      reason: 'Socket Port Collision (Error: listen EADDRINUSE: address already in use :::8080)',
      logs: `Error: listen EADDRINUSE: address already in use :::8080\nat Server.setupListenHandle [as _listen2] (node:net:1800)\nFATAL: Envoy listening socket already claimed by zombie pid.`,
      category: 'APPLICATION' as FailureCategory,
      title: 'HIGH: Socket Port Collision EADDRINUSE on Envoy Ingress',
      fix: 'fuser -k 8080/tcp && systemctl restart envoy'
    },
    {
      service: 'edge-ssl-proxy',
      reason: 'SSL/TLS Handshake Expiration (x509: certificate has expired)',
      logs: `x509: certificate has expired or is not yet valid (NotAfter: 2026-10-31).\nTLS handshake failed with remote client.\nReadiness probe failed on port 443 with connection refused.`,
      category: 'CONFIGURATION' as FailureCategory,
      title: 'HIGH: SSL Certificate Expired on Ingress Route',
      fix: 'cmctl renew certificate-prod-tls && kubectl rollout restart deploy/ingress-controller'
    }
  ];

  const shuffled = failureTypes.sort(() => 0.5 - Math.random());
  const fail1 = shuffled[0];
  const fail2 = shuffled[1];

  const deployments: Deployment[] = [
    {
      id: `dep-rnd-${randomSuffix}-1`,
      serviceName: fail1.service,
      environment: 'production',
      version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`,
      commitHash: Math.random().toString(16).substring(2, 9),
      commitMessage: `chore(core): auto-scheduled rollout for ${fail1.service}`,
      author: ['alex.chen', 'sarah.jenkins', 'vikram.patel', 'elena.rostova'][Math.floor(Math.random() * 4)],
      status: 'FAILED',
      startedAt: new Date(now - 1000 * 60 * 8).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 7).toISOString(),
      durationSeconds: 65,
      trigger: 'GITHUB_ACTIONS',
      failureReason: fail1.reason,
      incidentId: `INC-RND-${randomSuffix}-A`,
      rawLogs: fail1.logs,
      stages: [
        { id: 's1', name: 'Lint & Build', status: 'PASSED', durationMs: 3400 },
        { id: 's2', name: 'Healthcheck Verification', status: 'FAILED', durationMs: 8200, errorMessage: fail1.reason }
      ]
    },
    {
      id: `dep-rnd-${randomSuffix}-2`,
      serviceName: fail2.service,
      environment: 'production',
      version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`,
      commitHash: Math.random().toString(16).substring(2, 9),
      commitMessage: `feat(infra): update runtime settings on ${fail2.service}`,
      author: ['sarah.jenkins', 'kai.nakamura', 'clara.schmidt'][Math.floor(Math.random() * 3)],
      status: 'FAILED',
      startedAt: new Date(now - 1000 * 60 * 22).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 20).toISOString(),
      durationSeconds: 110,
      trigger: 'MANUAL_CLI',
      failureReason: fail2.reason,
      incidentId: `INC-RND-${randomSuffix}-B`,
      rawLogs: fail2.logs,
      stages: [
        { id: 's1', name: 'Container Build', status: 'PASSED', durationMs: 4100 },
        { id: 's2', name: 'Cluster Probe', status: 'FAILED', durationMs: 12000, errorMessage: fail2.reason }
      ]
    },
    {
      id: `dep-rnd-${randomSuffix}-3`,
      serviceName: 'user-profile-frontend',
      environment: 'production',
      version: 'v2.14.0',
      commitHash: Math.random().toString(16).substring(2, 9),
      commitMessage: 'ui(dashboard): modernize metrics visualization and responsive layouts',
      author: 'dev@deployguard.ai',
      status: 'SUCCESS',
      startedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 43).toISOString(),
      durationSeconds: 120,
      trigger: 'GITHUB_ACTIONS',
      rawLogs: `[INFO] Building Next.js static production bundle... Done in 3.4s.\n[INFO] Edge CDN deployed. Healthcheck: HTTP 200 OK.`,
      stages: [
        { id: 's1', name: 'Build & Minify', status: 'PASSED', durationMs: 4200 },
        { id: 's2', name: 'CDN Cache Invalidation', status: 'PASSED', durationMs: 2800 }
      ]
    },
    {
      id: `dep-rnd-${randomSuffix}-4`,
      serviceName: 'redis-session-store',
      environment: 'staging',
      version: 'v7.2.1',
      commitHash: Math.random().toString(16).substring(2, 9),
      commitMessage: 'chore(deps): update redis sentinel client to v7.2.1',
      author: 'marcus.vance',
      status: 'SUCCESS',
      startedAt: new Date(now - 1000 * 60 * 80).toISOString(),
      completedAt: new Date(now - 1000 * 60 * 78).toISOString(),
      durationSeconds: 95,
      trigger: 'GITHUB_ACTIONS',
      rawLogs: `[INFO] Redis cluster quorum verified across 3 nodes. Ping: PONG in 1.1ms.`,
      stages: [
        { id: 's1', name: 'Cluster Ping', status: 'PASSED', durationMs: 1800 }
      ]
    }
  ];

  const incidents: Incident[] = [
    {
      id: `INC-RND-${randomSuffix}-A`,
      title: fail1.title,
      serviceName: fail1.service,
      environment: 'production',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      deploymentId: `dep-rnd-${randomSuffix}-1`,
      rootCause: fail1.reason,
      category: fail1.category,
      assignee: 'SRE On-Call Engine',
      createdAt: new Date(now - 1000 * 60 * 7).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 7).toISOString(),
      recommendedSolution: fail1.fix,
      timeline: [
        { timestamp: new Date(now - 1000 * 60 * 7).toISOString(), message: `Anomaly detected by DeployGuard AI. Reason: ${fail1.reason}`, author: 'DeployGuard Autonomous Sentinel' }
      ]
    },
    {
      id: `INC-RND-${randomSuffix}-B`,
      title: fail2.title,
      serviceName: fail2.service,
      environment: 'production',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      deploymentId: `dep-rnd-${randomSuffix}-2`,
      rootCause: fail2.reason,
      category: fail2.category,
      assignee: 'DevOps Lead',
      createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 20).toISOString(),
      recommendedSolution: fail2.fix,
      timeline: [
        { timestamp: new Date(now - 1000 * 60 * 20).toISOString(), message: `Failure logged during automated canary test. Reason: ${fail2.reason}`, author: 'DeployGuard Autonomous Sentinel' }
      ]
    }
  ];

  return { deployments, incidents };
}

export function getProfileData(profileId: string = 'default'): { deployments: Deployment[]; incidents: Incident[]; profile: string } {
  switch (profileId) {
    case 'fintech_outage':
      return { deployments: FINTECH_DEPLOYMENTS, incidents: FINTECH_INCIDENTS, profile: 'fintech_outage' };
    case 'multicloud_cascade':
      return { deployments: MULTICLOUD_DEPLOYMENTS, incidents: MULTICLOUD_INCIDENTS, profile: 'multicloud_cascade' };
    case 'ai_cluster':
      return { deployments: AI_CLUSTER_DEPLOYMENTS, incidents: AI_CLUSTER_INCIDENTS, profile: 'ai_cluster' };
    case 'random': {
      const generated = generateRandomDataset();
      return { deployments: generated.deployments, incidents: generated.incidents, profile: 'random' };
    }
    case 'default':
    default:
      return { deployments: INITIAL_DEPLOYMENTS, incidents: INITIAL_INCIDENTS, profile: 'default' };
  }
}
