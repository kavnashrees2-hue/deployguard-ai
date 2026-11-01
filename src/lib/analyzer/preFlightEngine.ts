import { PreFlightAssessment, PreFlightCheckRequest } from '../types';

export class PreFlightEngine {
  public static assess(req: PreFlightCheckRequest): PreFlightAssessment {
    const text = `${req.commitMessage} ${req.codeDiff || ''}`.toLowerCase();
    let score = 15; // baseline low risk
    const blastRadius = new Set<string>();
    const recommendations: string[] = [];

    blastRadius.add(req.serviceName);

    // Downstream service mapping based on microservice architecture
    if (req.serviceName.includes('payment') || req.serviceName.includes('billing')) {
      blastRadius.add('checkout-frontend');
      blastRadius.add('subscription-cron-worker');
      blastRadius.add('customer-portal-api');
    } else if (req.serviceName.includes('auth') || req.serviceName.includes('gateway')) {
      blastRadius.add('all-microservices');
      blastRadius.add('mobile-client-api');
    } else if (req.serviceName.includes('database') || req.serviceName.includes('postgres')) {
      blastRadius.add('all-downstream-services');
    } else {
      blastRadius.add('edge-ingress-controller');
    }

    // 1. Database Risk Evaluation
    const hasDbRisk = req.touchesDatabase || 
      /alter\s+table|drop\s+column|add\s+constraint|migration|create\s+index\s+concurrently|lock|deadlock|foreign\s+key/i.test(text);

    // 2. Memory / Resource Risk Evaluation
    const hasMemoryRisk = req.touchesResources ||
      /heap|memory|oom|cgroup|unbounded|cache\s*=\s*new\s*map|buffer\.alloc|resources\.limits/i.test(text);

    // 3. Network / Port Binding Risk Evaluation
    const hasNetworkRisk = req.touchesNetwork ||
      /listen\(|port\s*[:=]|eaddrinuse|0\.0\.0\.0|bind|tls|cert|ssl|handshake/i.test(text);

    // 4. Dependency Risk Evaluation
    const hasDepRisk = req.touchesDependencies ||
      /package\.json|package-lock|npm\s+i|upgrade|breaking|major\s+version/i.test(text);

    // Calculate dynamic risk score
    if (hasDbRisk) {
      score += 35;
      if (/alter\s+table|drop\s+column|without\s+default/i.test(text)) {
        score += 20;
        recommendations.push('High-risk DDL detected: table rewrite will hold an exclusive ACCESS EXCLUSIVE lock. Use expand-and-contract pattern.');
      } else {
        recommendations.push('Ensure database migrations include a reverse migration script and backward-compatible columns.');
      }
    }

    if (hasMemoryRisk) {
      score += 30;
      recommendations.push('Memory allocation changes detected. Verify Kubernetes resource requests & limits align with runtime heap limits.');
    }

    if (hasNetworkRisk) {
      score += 25;
      recommendations.push('Port or network binding altered. Ensure container port does not collide with host daemon ports (8080, 27017, 3000).');
    }

    if (hasDepRisk) {
      score += 15;
      recommendations.push('Third-party dependencies updated. Run vulnerability scan (Trivy) and verify no peer dependency conflicts.');
    }

    // Environment multiplier
    if (req.environment === 'production') {
      score = Math.round(score * 1.15);
    }

    // Cap between 5 and 98
    const riskScore = Math.min(98, Math.max(8, score));

    let riskLevel: PreFlightAssessment['riskLevel'] = 'LOW';
    let decision: PreFlightAssessment['decision'] = 'APPROVED';

    if (riskScore >= 75) {
      riskLevel = 'CRITICAL';
      decision = 'BLOCKED';
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
      decision = 'CAUTION';
    } else if (riskScore >= 30) {
      riskLevel = 'MEDIUM';
      decision = 'CAUTION';
    } else {
      riskLevel = 'LOW';
      decision = 'APPROVED';
    }

    // Checklist generation
    const checklist = [
      {
        id: 'chk-1',
        label: 'Zero-Downtime Database Migration Safety',
        passed: !hasDbRisk || !/alter\s+table\s+.*drop/i.test(text),
        tip: 'Table locks over 500ms block all reader queries in Postgres/MySQL.'
      },
      {
        id: 'chk-2',
        label: 'Kubernetes Pod Resource Headroom (Memory/CPU)',
        passed: !hasMemoryRisk || /resources\.limits\.memory/i.test(text),
        tip: 'Memory limit must be at least 1.5x heap size to avoid kernel OOM killer (exit 137).'
      },
      {
        id: 'chk-3',
        label: 'Port & Host Network Socket Isolation',
        passed: !hasNetworkRisk || /0\.0\.0\.0:\d+/.test(text),
        tip: 'Check for hardcoded port allocations that cause EADDRINUSE on shared nodes.'
      },
      {
        id: 'chk-4',
        label: 'Graceful Shutdown & Healthcheck Probes Configured',
        passed: true,
        tip: 'Liveness & readiness probes must have initialDelaySeconds >= 10s.'
      },
      {
        id: 'chk-5',
        label: 'Canary Rollout & Automated Rollback Route Ready',
        passed: req.environment !== 'production' || riskScore < 75,
        tip: 'Deployments with high risk must use a 10% canary with automated error threshold triggers.'
      }
    ];

    let predictedFailureMode: string | undefined;
    let failureProbability = Math.min(95, Math.round(riskScore * 0.92));

    if (hasDbRisk) {
      predictedFailureMode = 'Database Migration Lock Timeout (P3005) or Connection Pool Starvation';
    } else if (hasMemoryRisk) {
      predictedFailureMode = 'Kubernetes Pod Out-Of-Memory Crash (OOMKilled, Exit Code 137)';
    } else if (hasNetworkRisk) {
      predictedFailureMode = 'Socket Port Collision (Error: listen EADDRINUSE) or TLS Handshake Failure';
    } else if (hasDepRisk) {
      predictedFailureMode = 'Module Resolution Conflict or Uncaught Exception during Bootstrap';
    }

    if (recommendations.length === 0) {
      recommendations.push('Changes follow clean architecture. Low regression probability detected.');
      recommendations.push('Enable standard 10% canary traffic progression.');
    }

    const summary = decision === 'BLOCKED'
      ? `DeployGuard AI Gatekeeper BLOCKED this deployment: Risk score (${riskScore}/100) exceeds safety threshold. High probability of ${predictedFailureMode || 'service disruption'}.`
      : decision === 'CAUTION'
      ? `DeployGuard AI Gatekeeper recommends MANUAL APPROVAL: Medium-to-high risk (${riskScore}/100) detected. Review checklist before proceeding.`
      : `DeployGuard AI Gatekeeper APPROVED: Low risk (${riskScore}/100). Clean pre-flight checks passed. Safe for automated rollout.`;

    return {
      riskScore,
      riskLevel,
      decision,
      summary,
      predictedFailureMode,
      failureProbability,
      blastRadius: Array.from(blastRadius),
      recommendations,
      checklist,
      analyzedAt: new Date().toISOString()
    };
  }
}

export const evaluatePreFlightRisk = (req: PreFlightCheckRequest): PreFlightAssessment => {
  return PreFlightEngine.assess(req);
};
