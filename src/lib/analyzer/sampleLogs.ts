import { SampleLogPreset } from '../types';

export const SAMPLE_LOG_PRESETS: SampleLogPreset[] = [
  {
    id: 'k8s-oom-killed',
    title: 'Kubernetes Pod OOMKilled (Exit Code 137)',
    service: 'recommendation-engine-api',
    category: 'INFRASTRUCTURE',
    description: 'Node.js/Python microservice killed by Linux kernel OOM killer during vector indexing.',
    logContent: `2026-10-20T10:14:02.112Z [INFO] Initializing RecommendationWorker v3.4.1...
2026-10-20T10:14:05.890Z [INFO] Connecting to Redis Cache at redis-cluster.internal:6379... Connected.
2026-10-20T10:14:08.204Z [INFO] Loading embedding tensor vectors into heap memory (500,000 items)...
2026-10-20T10:14:15.342Z [WARN] Heap usage reaching threshold: 462MB / 512MB limit allocated.
2026-10-20T10:14:18.901Z [INFO] Processing batch chunk #442...
2026-10-20T10:14:21.055Z kernel: [12948.330192] Memory cgroup out of memory: Kill process 42109 (node) score 982 or sacrifice child
2026-10-20T10:14:21.056Z kernel: [12948.330201] Killed process 42109 (node) total-vm:1894432kB, anon-rss:524288kB, file-rss:0kB
2026-10-20T10:14:21.410Z kubelet: Container recommendation-worker in pod recommendation-api-7b8f9c-v9xk2 was terminated. Reason: OOMKilled, Exit Code: 137
2026-10-20T10:14:21.411Z kubelet: Pod memory limit exceeded (limits.memory: 512Mi).
2026-10-20T10:14:25.000Z Error: Process completed with exit code 137.`
  },
  {
    id: 'db-pool-exhaustion',
    title: 'PostgreSQL Connection Pool Exhaustion',
    service: 'billing-transaction-worker',
    category: 'DATABASE',
    description: 'Spike in payment traffic saturated RDS PostgreSQL max_connections limit.',
    logContent: `2026-10-20T09:45:10.002Z [INFO] BillingWorker spinning up 8 concurrency workers...
2026-10-20T09:45:11.231Z [INFO] Subscribed to queue "billing.invoices.process"
2026-10-20T09:45:14.502Z [WARN] Pool connection acquisition taking longer than usual (4200ms)...
2026-10-20T09:45:16.890Z [ERROR] PrismaClientInitializationError:
Invalid \`prisma.invoice.findMany()\` invocation:
Can't reach database server at \`rds-aurora-postgres.internal\`:\`5432\`
Please make sure your database server is running at \`rds-aurora-postgres.internal\`:\`5432\`.
FATAL: remaining connection slots are reserved for non-replication superuser connections
    at PrismaClientKnownRequestError (/app/node_modules/@prisma/client/runtime/library.js:122:15)
    at ConnectionPool.acquire (/app/node_modules/pg-pool/index.js:312:11)
    at async processInvoiceBatch (/app/src/workers/billing.ts:89:22)
2026-10-20T09:45:17.104Z [FATAL] Timeout waiting for connection from pool after 10000ms. Connection pool is full (size: 100/100).
2026-10-20T09:45:17.150Z [FATAL] Process exiting with code 1 due to database connectivity failure.`
  },
  {
    id: 'port-eaddrinuse',
    title: 'Port Collision (EADDRINUSE 8080)',
    service: 'auth-service',
    category: 'CONFIGURATION',
    description: 'Stale instance did not shut down cleanly, preventing new container from binding port.',
    logContent: `2026-10-20T08:12:01.011Z [INFO] Starting AuthService on Node v20.11.0 in production mode...
2026-10-20T08:12:02.320Z [INFO] Connected to MongoDB database "auth_prod"
2026-10-20T08:12:02.500Z [INFO] Attempting to listen on 0.0.0.0:8080...
2026-10-20T08:12:02.544Z node:events:497
      throw er; // Unhandled 'error' event
      ^
Error: listen EADDRINUSE: address already in use 0.0.0.0:8080
    at Server.setupListenHandle [as _listen2] (node:net:1898:16)
    at listenInCluster (node:net:1946:12)
    at Server.listen (node:net:2044:7)
    at Function.listen (/app/node_modules/express/lib/application.js:635:24)
    at bootstrapServer (/app/dist/server.js:45:12)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1925:8)
2026-10-20T08:12:02.599Z [FATAL] Failed to bind to port 8080. Process terminated.`
  },
  {
    id: 'db-migration-lock',
    title: 'Database Migration Advisory Lock Timeout',
    service: 'user-profile-service',
    category: 'DATABASE',
    description: 'CI/CD pipeline failed during migration step because previous failed job left advisory lock held.',
    logContent: `2026-10-20T11:02:15.110Z [CI-STAGE: db:migrate] Running database schema migration...
2026-10-20T11:02:16.004Z Prisma schema loaded from prisma/schema.prisma
2026-10-20T11:02:16.890Z Datasource "db": PostgreSQL database "users_prod", schema "public"
2026-10-20T11:02:17.300Z 4 migrations found in prisma/migrations
2026-10-20T11:02:17.410Z Applying migration \`20261020110000_add_user_biometric_credentials\`...
2026-10-20T11:02:37.420Z [WARN] Waiting for schema migration advisory lock (20s elapsed)...
2026-10-20T11:03:17.450Z [WARN] Waiting for schema migration advisory lock (60s elapsed)...
2026-10-20T11:03:37.500Z Error: P3005: The database schema is locked for migrations.
Migration failed: Timed out waiting for lock on table "schema_migrations".
Cannot acquire advisory lock on postgres connection 10.0.4.12:5432.
Another migration process appears to be running or was abruptly terminated while holding the lock.
2026-10-20T11:03:37.520Z Command 'npx prisma migrate deploy' exited with status 1.`
  },
  {
    id: 'docker-dependency-eresolve',
    title: 'Docker Build Dependency Conflict (npm ERESOLVE)',
    service: 'admin-portal-frontend',
    category: 'DEPENDENCY',
    description: 'Docker image build step crashed during npm ci due to conflicting peer dependency versions.',
    logContent: `#8 [builder 4/7] COPY package.json package-lock.json ./
#8 DONE 0.1s
#9 [builder 5/7] RUN npm ci --prefer-offline
#9 1.402 npm error code ERESOLVE
#9 1.403 npm error ERESOLVE could not resolve
#9 1.403 npm error
#9 1.404 npm error While resolving: @tanstack/react-query@5.32.0
#9 1.404 npm error Found: react@19.0.0-rc
#9 1.404 npm error node_modules/react
#9 1.405 npm error   react@"^19.0.0" from the root project
#9 1.405 npm error
#9 1.405 npm error Could not resolve dependency:
#9 1.406 npm error peer react@"^18.0.0" from @tanstack/react-query@5.32.0
#9 1.406 npm error Conflicting peer dependency: react@18.3.1
#9 1.407 npm error
#9 1.407 npm error Fix the upstream dependency conflict, or retry this command with --legacy-peer-deps
#9 1.415 npm error A complete log can be found in: /root/.npm/_logs/2026-10-20T08_30_12_980Z-eresolve-report.txt
#9 ERROR: process "/bin/sh -c npm ci --prefer-offline" did not complete successfully: exit code: 1
------
 > [builder 5/7] RUN npm ci --prefer-offline:
------
failed to solve: process "/bin/sh -c npm ci --prefer-offline" did not complete successfully: exit code: 1`
  },
  {
    id: 'tls-cert-expired',
    title: 'Ingress TLS Certificate Expired (CERT_HAS_EXPIRED)',
    service: 'api-gateway-edge',
    category: 'SECURITY',
    description: 'SSL/TLS certificate on edge ingress expired before cert-manager automated renewal challenge completed.',
    logContent: `2026-10-20T12:00:01.001Z [CRIT] SSL handshake failed for client 198.51.100.24:49152
2026-10-20T12:00:01.002Z [ERROR] OpenSSL SSL_do_handshake() failed (SSL: error:0A000086:SSL routines::certificate verify failed: certificate has expired)
2026-10-20T12:00:01.005Z upstream backend: https://api.prod.company.io/v1/health
2026-10-20T12:00:01.010Z [FATAL] Client TLS Connection Aborted: CERT_HAS_EXPIRED
NotAfter validity timestamp was: 2026-10-20T00:00:00Z. Current time: 2026-10-20T12:00:01Z.
2026-10-20T12:00:01.020Z cert-manager controller: Failed to obtain certificate challenge from Let's Encrypt: ACME rate limit exceeded for domain api.prod.company.io`
  },
  {
    id: 'aws-iam-s3-accessdenied',
    title: 'AWS S3 Asset Upload AccessDenied (403 Forbidden)',
    service: 'document-export-service',
    category: 'SECURITY',
    description: 'IRSA IAM Role missing s3:PutObject permissions to destination enterprise bucket.',
    logContent: `2026-10-20T07:22:45.001Z [INFO] Generating financial audit statement export for Tenant #8819...
2026-10-20T07:22:48.330Z [INFO] Generated statement-2026-10.pdf (4.8 MB). Initiating multipart upload to S3...
2026-10-20T07:22:48.512Z [ERROR] AccessDenied: User: arn:aws:sts::123456789012:assumed-role/doc-export-worker-role/i-098234ab12
is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::prod-customer-reports-archive-us-east-1/reports/2026/10/statement-2026-10.pdf" with an explicit deny
    at Request.extractError (/app/node_modules/aws-sdk/lib/services/s3.js:712:35)
    at Request.callListeners (/app/node_modules/aws-sdk/lib/sequential_executor.js:106:20)
    at Request.emit (/app/node_modules/aws-sdk/lib/sequential_executor.js:78:10)
    at Request.emit (/app/node_modules/aws-sdk/lib/request.js:688:14)
2026-10-20T07:22:48.550Z [FATAL] HTTP 403 Forbidden from AWS S3 API. Aborting export pipeline.`
  },
  {
    id: 'k8s-liveness-probe-fail',
    title: 'Kubernetes CrashLoopBackOff & Liveness Probe Timeout',
    service: 'payment-gateway-proxy',
    category: 'APPLICATION',
    description: 'Heavy database initialization query blocked event loop, causing liveness probe HTTP 503 and restart.',
    logContent: `2026-10-20T06:10:00.120Z [INFO] PaymentGateway booting on port 3000...
2026-10-20T06:10:02.400Z [INFO] Synchronizing payment provider token tables...
2026-10-20T06:10:15.000Z kubelet: Readiness probe failed: HTTP probe failed with statuscode: 503
2026-10-20T06:10:25.000Z kubelet: Liveness probe failed: Get "http://10.244.2.81:3000/healthz": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
2026-10-20T06:10:25.100Z kubelet: Container payment-gateway failed liveness probe, will be restarted
2026-10-20T06:10:35.000Z kubelet: Back-off 20s restarting failed container=payment-gateway pod=payment-gateway-69d58b76df-2z7pm
2026-10-20T06:11:15.000Z kubelet: Back-off 40s restarting failed container=payment-gateway pod=payment-gateway-69d58b76df-2z7pm
2026-10-20T06:11:16.000Z [FATAL] Pod status: CrashLoopBackOff (restarts: 5)`
  }
];
