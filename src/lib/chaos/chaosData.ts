import { ChaosNode, ChaosScenario } from '../types';

export const INITIAL_CHAOS_NODES: ChaosNode[] = [
  {
    id: 'edge-ingress',
    name: 'Edge Ingress Gateway',
    type: 'INGRESS',
    status: 'HEALTHY',
    latencyMs: 12,
    errorRate: 0.0,
    activeReplicas: '3/3',
    details: 'Cloudflare Edge Proxy + TLS 1.3 Termination'
  },
  {
    id: 'api-gateway',
    name: 'Kong API Gateway',
    type: 'GATEWAY',
    status: 'HEALTHY',
    latencyMs: 24,
    errorRate: 0.01,
    activeReplicas: '4/4',
    details: 'Rate limiting, Auth routing & JWT validation'
  },
  {
    id: 'auth-service',
    name: 'Auth & Identity Service',
    type: 'SERVICE',
    status: 'HEALTHY',
    latencyMs: 18,
    errorRate: 0.0,
    activeReplicas: '2/2',
    details: 'OAuth2/OIDC provider & token generation'
  },
  {
    id: 'order-worker',
    name: 'Order Processing Worker',
    type: 'SERVICE',
    status: 'HEALTHY',
    latencyMs: 45,
    errorRate: 0.05,
    activeReplicas: '4/4',
    details: 'Checkout pipeline, payment gateway integration'
  },
  {
    id: 'postgres-primary',
    name: 'PostgreSQL 16 Primary',
    type: 'DATABASE',
    status: 'HEALTHY',
    latencyMs: 8,
    errorRate: 0.0,
    activeReplicas: '1/1 (Leader)',
    details: 'Multi-AZ replication, pgBouncer pool (pool size: 100)'
  },
  {
    id: 'redis-cache',
    name: 'Redis L2 Session Cluster',
    type: 'CACHE',
    status: 'HEALTHY',
    latencyMs: 2,
    errorRate: 0.0,
    activeReplicas: '3/3 Sentinel',
    details: 'Distributed cache for JWT blacklist & hot inventory'
  }
];

export const CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: 'OOM_SPIKE',
    name: 'OOMKilled Heap Saturation',
    targetService: 'order-worker',
    faultType: 'RESOURCE_EXHAUSTION',
    description: 'Inject unbounded memory leak into order checkout queue until container exceeds cgroup 512MB limit.',
    blastRadius: ['order-worker', 'api-gateway'],
    remediationTitle: 'Auto-Scale Replicas & Dynamic Heap Quarantine',
    remediationCommand: 'kubectl scale deployment order-worker --replicas=8 && sysctl -w vm.overcommit_memory=1'
  },
  {
    id: 'DB_POOL_STARVATION',
    name: 'Database Connection Pool Exhaustion',
    targetService: 'postgres-primary',
    faultType: 'POOL_STARVATION',
    description: 'Spike active pool connections to 100% capacity via unindexed runaway queries, triggering client connection timeout.',
    blastRadius: ['postgres-primary', 'auth-service', 'order-worker', 'api-gateway'],
    remediationTitle: 'PgBouncer Pool Recycling & Query Circuit Breaker',
    remediationCommand: 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle in transaction\';'
  },
  {
    id: 'TLS_CERT_EXPIRY',
    name: 'Edge SSL/TLS Handshake Expiration',
    targetService: 'edge-ingress',
    faultType: 'CERTIFICATE_EXPIRY',
    description: 'Inject expired Let\'s Encrypt leaf certificate into ingress controller, causing client handshake drops.',
    blastRadius: ['edge-ingress', 'api-gateway'],
    remediationTitle: 'Cert-Manager ACME Zero-Downtime Hot Renewal',
    remediationCommand: 'cmctl renew certificate-prod-tls && kubectl rollout restart deploy/ingress-nginx'
  },
  {
    id: 'REDIS_CACHE_COLLAPSE',
    name: 'Redis Cache Thundering Herd / Stampede',
    targetService: 'redis-cache',
    faultType: 'CACHE_STAMPEDE',
    description: 'Sever Redis sentinel quorum, causing 100% cache misses to fall back directly to PostgreSQL disk queries.',
    blastRadius: ['redis-cache', 'postgres-primary', 'auth-service'],
    remediationTitle: 'Redis Failover Promotion & Adaptive Mutex Lock',
    remediationCommand: 'redis-cli sentinel failover mymaster && redis-cli set probe:health OK EX 10'
  },
  {
    id: 'PORT_COLLISION',
    name: 'EADDRINUSE Port Collision & CrashLoop',
    targetService: 'api-gateway',
    faultType: 'PORT_CONFLICT',
    description: 'Spawn zombie process on port 8080 preventing API Gateway container from binding listening socket.',
    blastRadius: ['api-gateway', 'edge-ingress'],
    remediationTitle: 'Zombie Process SIGKILL & Socket Rebind',
    remediationCommand: 'fuser -k 8080/tcp && systemctl restart envoy-gateway'
  }
];

