import { describe, it, expect } from 'vitest';
import { evaluatePreFlightRisk } from '../lib/analyzer/preFlightEngine';
import { INITIAL_CHAOS_NODES, CHAOS_SCENARIOS } from '../lib/chaos/chaosData';

describe('Pre-Flight AI Risk Gatekeeper Engine', () => {
  it('approves a safe frontend CSS tweak with low risk score', () => {
    const assessment = evaluatePreFlightRisk({
      serviceName: 'dashboard-frontend',
      environment: 'staging',
      commitMessage: 'style: update sidebar button padding',
      author: 'dev@deployguard.ai',
      codeDiff: 'button { padding: 8px 12px; }'
    });

    expect(assessment.decision).toBe('APPROVED');
    expect(assessment.riskLevel).toBe('LOW');
    expect(assessment.riskScore).toBeLessThan(35);
  });

  it('blocks high-risk destructive database drops in production', () => {
    const assessment = evaluatePreFlightRisk({
      serviceName: 'auth-service',
      environment: 'production',
      commitMessage: 'refactor: drop old sessions table',
      author: 'lead@deployguard.ai',
      codeDiff: 'ALTER TABLE users DROP COLUMN token;',
      touchesDatabase: true
    });

    expect(assessment.decision).toBe('BLOCKED');
    expect(assessment.riskLevel).toBe('CRITICAL');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(assessment.blastRadius).toContain('all-microservices');
    expect(assessment.checklist.some((item) => item.id === 'chk-1' && !item.passed)).toBe(true);
  });

  it('flags unbounded memory leak loops as caution or blocked', () => {
    const assessment = evaluatePreFlightRisk({
      serviceName: 'payment-worker',
      environment: 'production',
      commitMessage: 'feat: add event queue accumulator',
      author: 'eng@deployguard.ai',
      codeDiff: 'const cache = []; while(true) { cache.push(new Buffer(1024 * 1024)); }',
      touchesResources: true
    });

    expect(['BLOCKED', 'CAUTION']).toContain(assessment.decision);
    expect(assessment.riskScore).toBeGreaterThan(35);
    expect(assessment.predictedFailureMode).toContain('Out-Of-Memory');
  });
});

describe('Chaos Engineering & Resilience Sandbox', () => {
  it('initial topology has 6 healthy nodes with valid initial metrics', () => {
    expect(INITIAL_CHAOS_NODES.length).toBe(6);
    INITIAL_CHAOS_NODES.forEach((node) => {
      expect(node.status).toBe('HEALTHY');
      expect(node.errorRate).toBeLessThanOrEqual(0.05);
      expect(node.latencyMs).toBeGreaterThan(0);
    });
  });

  it('all chaos scenarios have target services, descriptions, and automated remediation runbooks', () => {
    expect(CHAOS_SCENARIOS.length).toBeGreaterThanOrEqual(5);
    CHAOS_SCENARIOS.forEach((scenario) => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.targetService).toBeTruthy();
      expect(scenario.blastRadius.length).toBeGreaterThan(0);
      expect(scenario.remediationTitle).toBeTruthy();
      expect(scenario.remediationCommand).toBeTruthy();
    });
  });
});
