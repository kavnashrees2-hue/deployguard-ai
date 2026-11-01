import { FailureCategory, RemediationStep, Severity } from '../types';

export interface ErrorSignature {
  id: string;
  name: string;
  category: FailureCategory;
  severity: Severity;
  patterns: RegExp[];
  keywordWeightMap: Record<string, number>;
  summary: string;
  rootCause: string;
  affectedComponent: string;
  remediationSteps: RemediationStep[];
  preventativeMeasures: string[];
  docLinks?: { label: string; url: string }[];
}

export const ERROR_SIGNATURES: ErrorSignature[] = [
  {
    id: 'K8S_OOM_KILLED',
    name: 'Kubernetes Pod Out-Of-Memory (OOMKilled)',
    category: 'INFRASTRUCTURE',
    severity: 'CRITICAL',
    patterns: [
      /exit code 137/i,
      /oomkilled/i,
      /out of memory: kill process/i,
      /container.*was terminated.*reason: oomkilled/i,
      /memory limit exceeded/i
    ],
    keywordWeightMap: {
      '137': 25,
      'oomkilled': 40,
      'memory': 15,
      'cgroup': 10,
      'pod': 10
    },
    summary: 'The container was forcefully terminated by the Linux kernel OOM killer because memory consumption exceeded the allocated cgroup memory limit.',
    rootCause: 'Application memory leak, insufficient Kubernetes container memory limits in pod spec (resources.limits.memory), or sudden heap spikes during startup.',
    affectedComponent: 'Kubernetes Pod Memory Controller / Linux cgroups',
    remediationSteps: [
      {
        step: 1,
        title: 'Inspect pod termination reason and memory usage',
        description: 'Verify the container exit code (137) and check live memory usage against pod cgroup allocations.',
        command: 'kubectl describe pod <pod-name> -n <namespace> | grep -E "Exit Code|OOMKilled|Limits"',
        verificationCommand: 'kubectl top pod -n <namespace>'
      },
      {
        step: 2,
        title: 'Check whether the application has a memory leak',
        description: 'Examine previous stdout/stderr logs for uncollected heap allocations, unbounded caches, or buffer leaks.',
        command: 'kubectl logs <pod-name> --previous --tail=100 | grep -iE "heap|leak|allocation|GC"'
      },
      {
        step: 3,
        title: 'Recommend suitable memory requests and limits',
        description: 'Increase pod memory limits and requests to provide sufficient headroom (e.g. from 512Mi to 1.5Gi).',
        command: 'kubectl set resources deployment <deployment-name> --limits=memory=1.5Gi --requests=memory=768Mi -n <namespace>'
      },
      {
        step: 4,
        title: 'Suggest checking Node.js/JVM heap settings',
        description: 'Align runtime memory heap thresholds with container cgroup limits so garbage collector kicks in before kernel OOM.',
        command: 'export NODE_OPTIONS="--max-old-space-size=1200" # Or -XX:MaxRAMPercentage=75.0 for JVM'
      },
      {
        step: 5,
        title: 'Verify whether the issue is resolved after redeployment',
        description: 'Monitor the rollout to ensure new replica pods become 1/1 READY without CrashLoopBackOff or restart spikes.',
        command: 'kubectl rollout status deployment/<deployment-name> -n <namespace> && kubectl top pods -n <namespace>'
      }
    ],
    preventativeMeasures: [
      'Implement Vertical Pod Autoscaler (VPA) in recommendation mode to detect optimal memory sizing.',
      'Configure Prometheus alerts when Pod memory utilization exceeds 80% for > 5 minutes.',
      'Profile application heap allocations and inspect for unclosed database connections or unbounded cache maps.'
    ],
    docLinks: [
      { label: 'Kubernetes Memory Management Guide', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' }
    ]
  },
  {
    id: 'K8S_CRASHLOOP_BACKOFF',
    name: 'Kubernetes CrashLoopBackOff & Liveness Probe Failure',
    category: 'APPLICATION',
    severity: 'HIGH',
    patterns: [
      /crashloopbackoff/i,
      /back-off.*restarting failed container/i,
      /liveness probe failed/i,
      /readiness probe failed: http probe failed with statuscode: 503/i
    ],
    keywordWeightMap: {
      'crashloopbackoff': 45,
      'back-off': 25,
      'liveness': 20,
      'restart': 10
    },
    summary: 'The application container repeatedly starts and crashes immediately, triggering Kubernetes exponential backoff delay.',
    rootCause: 'Uncaught fatal exception during initialization, missing mandatory environment variables, or overly strict liveness probes killing the pod before it finishes booting.',
    affectedComponent: 'Kubernetes Kubelet / Pod Lifecycle Manager',
    remediationSteps: [
      {
        step: 1,
        title: 'Check previous container crash logs',
        description: 'View the stdout/stderr logs from the crashed container instance before it restarted.',
        command: 'kubectl logs <pod-name> -n <namespace> --previous --tail=100'
      },
      {
        step: 2,
        title: 'Check liveness and readiness probe configuration',
        description: 'Increase initialDelaySeconds on liveness probes if the app takes longer than expected to boot up.',
        command: 'kubectl edit deployment <deployment-name> -n <namespace>'
      },
      {
        step: 3,
        title: 'Run debug container or interactive shell',
        description: 'Spawn an ephemeral container or override entrypoint to debug environment variables and dependencies.',
        command: 'kubectl debug -it <pod-name> --image=busybox -n <namespace> -- sh'
      }
    ],
    preventativeMeasures: [
      'Set initialDelaySeconds: 30 and failureThreshold: 3 on HTTP healthcheck probes.',
      'Add structured error handling during server bootstrap with exit code 0/1 logging.',
      'Validate all required environment variables on startup with a schema validator (Zod/Joi).'
    ]
  },
  {
    id: 'DB_CONNECTION_EXHAUSTION',
    name: 'Database Connection Pool Exhaustion',
    category: 'DATABASE',
    severity: 'CRITICAL',
    patterns: [
      /remaining connection slots are reserved for non-replication superuser connections/i,
      /too many connections/i,
      /timeout waiting for connection from pool/i,
      /pool.*timed out/i,
      /connection pool is full/i,
      /prismaclientinitializationerror.*can't reach database server/i
    ],
    keywordWeightMap: {
      'connection': 25,
      'pool': 35,
      'timeout': 15,
      'exhausted': 15,
      'slots': 10
    },
    summary: 'All available PostgreSQL/MySQL database connection slots are occupied. Incoming worker requests are blocked and timing out.',
    rootCause: 'Multiple horizontal pod replicas opened default connection pools (e.g. 20 connections * 10 pods = 200) exceeding RDS/Postgres max_connections, or long-running queries held transactions open without releasing.',
    affectedComponent: 'Relational Database / Connection Pool Manager (PgBouncer, Prisma, HikariCP)',
    remediationSteps: [
      {
        step: 1,
        title: 'Inspect active database queries and connection count',
        description: 'Query PostgreSQL pg_stat_activity to find stale or idle-in-transaction client sockets.',
        command: "psql $DATABASE_URL -c \"SELECT count(*), state FROM pg_stat_activity GROUP BY state;\""
      },
      {
        step: 2,
        title: 'Terminate idle transactions holding pool locks',
        description: 'Forcefully cancel connections that have been idle in transaction for more than 5 minutes.',
        command: "psql $DATABASE_URL -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - interval '5 minutes';\""
      },
      {
        step: 3,
        title: 'Configure connection pooling proxy (PgBouncer / AWS RDS Proxy)',
        description: 'Enforce connection pool limits in the application database connection string (e.g., ?connection_limit=5&pool_timeout=20).'
      }
    ],
    preventativeMeasures: [
      'Deploy PgBouncer in transaction mode between Kubernetes pods and database.',
      'Enforce statement timeouts (SET statement_timeout = 5000) on read workloads.',
      'Calculate pool size formula: ((core_count * 2) + effective_spindle_count) per instance.'
    ]
  },
  {
    id: 'PORT_CONFLICT_EADDRINUSE',
    name: 'Port Binding Conflict (EADDRINUSE)',
    category: 'CONFIGURATION',
    severity: 'HIGH',
    patterns: [
      /eaddrinuse/i,
      /address already in use/i,
      /bind: address already in use/i,
      /listen tcp.*address already in use/i
    ],
    keywordWeightMap: {
      'eaddrinuse': 50,
      'port': 25,
      'bind': 15,
      'listen': 10
    },
    summary: 'The application failed to bind its HTTP/gRPC server socket because the specified network port is already allocated by another running process.',
    rootCause: 'A zombie background process from a previous deployment was not gracefully terminated, hostPort was hardcoded across multiple container replicas on the same node, or another service is listening on port 3000/8080.',
    affectedComponent: 'Operating System TCP Network Stack / Process Manager',
    remediationSteps: [
      {
        step: 1,
        title: 'Locate the offending process using the port',
        description: 'Find PID of the process bound to the specified port.',
        command: 'lsof -i :8080 -sTCP:LISTEN -t || netstat -ano | findstr :8080'
      },
      {
        step: 2,
        title: 'Gracefully terminate the stale process',
        description: 'Send SIGTERM or SIGKILL to release the bound socket.',
        command: 'kill -9 $(lsof -t -i:8080) || taskkill /F /PID <PID>'
      },
      {
        step: 3,
        title: 'Parameterize PORT environment variable in container',
        description: 'Allow dynamic port assignment via $PORT or use Kubernetes Service clusterIP abstraction rather than hostPort.'
      }
    ],
    preventativeMeasures: [
      'Avoid hostNetwork: true or hostPort in Kubernetes pod specifications.',
      'Implement graceful shutdown handlers with SIGTERM capturing server.close().'
    ]
  },
  {
    id: 'DB_MIGRATION_LOCK_TIMEOUT',
    name: 'Database Migration Lock Acquisition Failure',
    category: 'DATABASE',
    severity: 'HIGH',
    patterns: [
      /migration.*timed out waiting for lock/i,
      /database is locked/i,
      /schema_migrations.*lock/i,
      /lock table.*timeout/i,
      /cannot acquire advisory lock/i,
      /deadlock detected/i
    ],
    keywordWeightMap: {
      'migration': 30,
      'lock': 35,
      'timeout': 20,
      'advisory': 15
    },
    summary: 'CI/CD pipeline failed during automated database migration because a previous migration worker crashed while holding the migration schema lock table.',
    rootCause: 'A previous deployment pipeline was aborted or terminated before it could release the schema lock table (e.g. `_prisma_migrations`, `flyway_schema_history`, or PostgreSQL `pg_advisory_lock`).',
    affectedComponent: 'Database Schema Migrator (Prisma / Flyway / Liquibase / TypeORM)',
    remediationSteps: [
      {
        step: 1,
        title: 'Check database advisory lock status',
        description: 'Find active lock records holding the migration lock.',
        command: "psql $DATABASE_URL -c \"SELECT pid, locktype, mode, granted FROM pg_locks WHERE locktype = 'advisory';\""
      },
      {
        step: 2,
        title: 'Release stale advisory lock or clear migration lock table',
        description: 'For Prisma: mark failed migration rolled back or resolve locks. For Flyway: run repair.',
        command: 'npx prisma migrate resolve --rolled-back "<migration_name>" || flyway repair'
      },
      {
        step: 3,
        title: 'Re-run migration step in isolation with verbose logging',
        description: 'Verify schema consistency before redeploying the application image.',
        command: 'npx prisma migrate deploy'
      }
    ],
    preventativeMeasures: [
      'Separate schema migrations into a distinct Kubernetes Job that runs prior to rolling deployment.',
      'Configure migration lock timeout limits so locks expire automatically if a worker terminates.'
    ]
  },
  {
    id: 'DOCKER_BUILD_CACHE_FAIL',
    name: 'Docker Image Build / Layer Cache Corruption',
    category: 'DEPENDENCY',
    severity: 'MEDIUM',
    patterns: [
      /failed to solve: process.*exit code: 1/i,
      /npm err! code eresolve/i,
      /could not resolve dependency/i,
      /layer sha256.*not found/i,
      /docker build.*failed to compute cache key/i,
      /error: unable to prepare context/i
    ],
    keywordWeightMap: {
      'docker': 20,
      'build': 20,
      'cache': 20,
      'eresolve': 25,
      'dependency': 15
    },
    summary: 'Container image build failed during CI/CD compilation due to npm peer dependency mismatches or invalid Dockerfile context cache.',
    rootCause: 'A newly introduced package has peer dependency conflicts with existing modules, or the Docker build context included files excluded by .dockerignore.',
    affectedComponent: 'Docker Engine / BuildKit / Package Manager',
    remediationSteps: [
      {
        step: 1,
        title: 'Run package resolution with legacy peer deps or audit fix',
        description: 'Test dependency graph resolution locally.',
        command: 'npm install --legacy-peer-deps --dry-run'
      },
      {
        step: 2,
        title: 'Build Docker image without cache to test reproducibility',
        description: 'Ensure clean build artifact without stale layer hashes.',
        command: 'docker build --no-cache -t deployguard-test:latest .'
      },
      {
        step: 3,
        title: 'Verify .dockerignore file',
        description: 'Ensure node_modules, .git, and local environment files are ignored from build context.'
      }
    ],
    preventativeMeasures: [
      'Commit a verified package-lock.json or pnpm-lock.yaml and use `npm ci` in CI/CD.',
      'Enable multi-stage Docker builds with BuildKit caching (`DOCKER_BUILDKIT=1`).'
    ]
  },
  {
    id: 'TLS_SSL_CERT_EXPIRED',
    name: 'TLS/SSL Certificate Expired or Handshake Failure',
    category: 'SECURITY',
    severity: 'CRITICAL',
    patterns: [
      /certificate has expired/i,
      /cert_has_expired/i,
      /ssl: certificate_verify_failed/i,
      /unable to get local issuer certificate/i,
      /x509: certificate signed by unknown authority/i,
      /handshake failure/i
    ],
    keywordWeightMap: {
      'certificate': 30,
      'expired': 30,
      'ssl': 20,
      'tls': 15,
      'handshake': 15
    },
    summary: 'Inbound or outbound HTTPS/TLS connections are rejected because the x509 SSL certificate has expired or its root CA chain cannot be verified.',
    rootCause: 'Cert-manager automated renewal failed, Let\'s Encrypt rate limit was hit, or intermediate certificate authority bundle was missing from the ingress controller.',
    affectedComponent: 'Ingress Controller / TLS Termination Proxy / cert-manager',
    remediationSteps: [
      {
        step: 1,
        title: 'Inspect SSL certificate expiration date from domain',
        description: 'Query remote certificate details using openssl.',
        command: 'openssl s_client -connect <your-domain.com>:443 -servername <your-domain.com> 2>/dev/null | openssl x509 -noout -dates'
      },
      {
        step: 2,
        title: 'Check cert-manager certificate request & challenge status',
        description: 'Review cert-manager events in the cluster.',
        command: 'kubectl get certificate,certificaterequest,challenge -A'
      },
      {
        step: 3,
        title: 'Force renewal or upload updated PEM certificate secret',
        description: 'Trigger immediate cert-manager reissuance.',
        command: 'kubectl cert-manager renew <certificate-name> -n <namespace>'
      }
    ],
    preventativeMeasures: [
      'Configure certificate expiry monitoring alerts at 30, 14, and 7 days prior to expiration.',
      'Automate DNS-01 or HTTP-01 challenges with valid Cloudflare/Route53 IAM role.'
    ]
  },
  {
    id: 'AWS_IAM_PERMISSION_DENIED',
    name: 'Cloud Provider IAM / S3 Permission Denied (403 Forbidden)',
    category: 'SECURITY',
    severity: 'HIGH',
    patterns: [
      /accessdenied/i,
      /403 forbidden/i,
      /is not authorized to perform/i,
      /assumerolewithwebidentity/i,
      /the specified key does not exist/i,
      /credentials.*could not be loaded/i
    ],
    keywordWeightMap: {
      'accessdenied': 40,
      'forbidden': 25,
      'authorized': 20,
      'iam': 15
    },
    summary: 'The deployment service account or container pod lacks necessary IAM policy permissions to access target cloud resources (S3, ECR, Secrets Manager, etc.).',
    rootCause: 'IRSA (IAM Roles for Service Accounts) OIDC role binding missing, trust policy condition mismatch, or S3 bucket policy explicitly denying KMS decrypt.',
    affectedComponent: 'AWS / Cloud IAM & Security Token Service (STS)',
    remediationSteps: [
      {
        step: 1,
        title: 'Check service account annotations for IAM role ARN',
        description: 'Verify whether the pod service account is annotated with the expected IAM role.',
        command: 'kubectl get serviceaccount <sa-name> -n <namespace> -o yaml | grep eks.amazonaws.com/role-arn'
      },
      {
        step: 2,
        title: 'Test STS assume-role or credential token injection',
        description: 'Verify if AWS_WEB_IDENTITY_TOKEN_FILE is present inside the container.',
        command: 'kubectl exec -it <pod-name> -n <namespace> -- env | grep AWS'
      },
      {
        step: 3,
        title: 'Attach missing action permissions to the IAM role',
        description: 'Update the IAM policy to allow target actions (e.g. s3:GetObject, ecr:GetAuthorizationToken).'
      }
    ],
    preventativeMeasures: [
      'Apply Infrastructure-as-Code (Terraform/OpenTofu) linting with tfsec or checkov to enforce least privilege IAM policies.',
      'Test IAM policies in staging environments with automated permission integration tests.'
    ]
  },
  {
    id: 'UPSTREAM_GATEWAY_TIMEOUT',
    name: 'Upstream Microservice Gateway Timeout (504 / Healthcheck Failure)',
    category: 'NETWORK',
    severity: 'HIGH',
    patterns: [
      /504 gateway time-out/i,
      /502 bad gateway/i,
      /upstream request timeout/i,
      /failed to connect to upstream/i,
      /connection refused.*upstream/i,
      /etimedout/i
    ],
    keywordWeightMap: {
      'timeout': 30,
      'upstream': 30,
      'gateway': 20,
      'etimedout': 20
    },
    summary: 'The API gateway or ingress proxy timed out while awaiting a response from the downstream microservice pod.',
    rootCause: 'Downstream service was undergoing cold start, hung on a slow third-party dependency, or internal CoreDNS service discovery resolution failed.',
    affectedComponent: 'API Gateway / Service Mesh / Ingress Envoy/Nginx',
    remediationSteps: [
      {
        step: 1,
        title: 'Verify upstream pod health and endpoints list',
        description: 'Check if the backend service has healthy endpoints registered in Kubernetes.',
        command: 'kubectl get endpoints <service-name> -n <namespace>'
      },
      {
        step: 2,
        title: 'Check CoreDNS resolution and cluster networking',
        description: 'Confirm DNS resolving inside the cluster.',
        command: 'kubectl run dnsutils --image=tutum/dnsutils --rm -it --restart=Never -- nslookup <service-name>'
      },
      {
        step: 3,
        title: 'Adjust proxy read timeouts or configure circuit breakers',
        description: 'Increase proxy_read_timeout in NGINX ingress annotation or enable retry policies.'
      }
    ],
    preventativeMeasures: [
      'Implement circuit breaker patterns (Resilience4j, Envoy) to fail fast on slow backends.',
      'Introduce readiness probes to prevent traffic routing before the service is warm.'
    ]
  },
  {
    id: 'MISSING_ENV_VARIABLE',
    name: 'Missing Required Environment Variable / Config Secret',
    category: 'CONFIGURATION',
    severity: 'HIGH',
    patterns: [
      /environment variable.*is required/i,
      /process\.env\..*is undefined/i,
      /missing required env/i,
      /keyerror: '.*'/i,
      /cannot read properties of undefined.*process\.env/i,
      /config error: missing/i
    ],
    keywordWeightMap: {
      'environment': 30,
      'missing': 30,
      'undefined': 25,
      'variable': 15
    },
    summary: 'Application crashed during startup because a mandatory environment variable or config secret was omitted from the deployment specification.',
    rootCause: 'A newly introduced feature depends on a config key (e.g. STRIPE_API_KEY, DATABASE_URL) that was added to code but not synced to Kubernetes Secret/ConfigMap or CI/CD secret manager.',
    affectedComponent: 'Configuration Loader / Kubernetes Secret & ConfigMap',
    remediationSteps: [
      {
        step: 1,
        title: 'Check ConfigMap and Secret keys mounted in the pod',
        description: 'Inspect the environment variables defined in the deployment spec.',
        command: 'kubectl get deployment <deployment-name> -n <namespace> -o jsonpath="{.spec.template.spec.containers[*].env}"'
      },
      {
        step: 2,
        title: 'Add the missing key to Kubernetes Secret / ConfigMap',
        description: 'Update the secret with base64 encoded value.',
        command: 'kubectl create secret generic <secret-name> --from-literal=<KEY>=<VALUE> --dry-run=client -o yaml | kubectl apply -f -'
      },
      {
        step: 3,
        title: 'Trigger a rolling restart to reload updated secrets',
        description: 'Restart the pods so they pick up new environment values.',
        command: 'kubectl rollout restart deployment <deployment-name> -n <namespace>'
      }
    ],
    preventativeMeasures: [
      'Use schema validation (Zod/Joi) that outputs a clear missing key checklist during local and CI testing.',
      'Implement External Secrets Operator to sync Vault/AWS Secrets Manager automatically.'
    ]
  }
];
