import { describe, it, expect } from 'vitest';
import { RuleBasedLogAnalyzer } from '../lib/analyzer/ruleEngine';
import { SAMPLE_LOG_PRESETS } from '../lib/analyzer/sampleLogs';

describe('RuleBasedLogAnalyzer Engine Tests', () => {
  it('should correctly identify Kubernetes Pod OOMKilled from logs', () => {
    const oomPreset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'k8s-oom-killed')!;
    const result = RuleBasedLogAnalyzer.analyze(oomPreset.logContent);

    expect(result.signatureId).toBe('K8S_OOM_KILLED');
    expect(result.category).toBe('INFRASTRUCTURE');
    expect(result.severity).toBe('CRITICAL');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(75);
    expect(result.remediationSteps.length).toBeGreaterThan(0);
    expect(result.remediationSteps[0].command).toContain('kubectl');
  });

  it('should correctly identify PostgreSQL Connection Pool Exhaustion', () => {
    const dbPreset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'db-pool-exhaustion')!;
    const result = RuleBasedLogAnalyzer.analyze(dbPreset.logContent);

    expect(result.signatureId).toBe('DB_CONNECTION_EXHAUSTION');
    expect(result.category).toBe('DATABASE');
    expect(result.severity).toBe('CRITICAL');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(result.rootCause).toContain('RDS/Postgres max_connections');
  });

  it('should correctly identify Port Collision (EADDRINUSE 8080)', () => {
    const portPreset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'port-eaddrinuse')!;
    const result = RuleBasedLogAnalyzer.analyze(portPreset.logContent);

    expect(result.signatureId).toBe('PORT_CONFLICT_EADDRINUSE');
    expect(result.category).toBe('CONFIGURATION');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(70);
    expect(result.remediationSteps.some((s) => s.command?.includes('kill'))).toBe(true);
  });

  it('should correctly identify Database Migration Advisory Lock Timeout', () => {
    const lockPreset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'db-migration-lock')!;
    const result = RuleBasedLogAnalyzer.analyze(lockPreset.logContent);

    expect(result.signatureId).toBe('DB_MIGRATION_LOCK_TIMEOUT');
    expect(result.category).toBe('DATABASE');
  });

  it('should correctly identify TLS Certificate Expiration', () => {
    const tlsPreset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'tls-cert-expired')!;
    const result = RuleBasedLogAnalyzer.analyze(tlsPreset.logContent);

    expect(result.signatureId).toBe('TLS_SSL_CERT_EXPIRED');
    expect(result.category).toBe('SECURITY');
    expect(result.severity).toBe('CRITICAL');
  });

  it('should handle empty or whitespace logs gracefully without throwing', () => {
    const emptyResult = RuleBasedLogAnalyzer.analyze('   \n  ');
    expect(emptyResult.signatureId).toBe('NO_LOGS_PROVIDED');
    expect(emptyResult.confidenceScore).toBe(0);
  });

  it('should run heuristic fallback analysis for unknown error traces', () => {
    const unknownLog = `
2026-10-20T10:00:00Z [INFO] Service started
2026-10-20T10:00:05Z [ERROR] Fatal uncaughtException in custom proprietary handler
at CustomInternalService.computeAlgorithm (/app/custom.js:99:12)
2026-10-20T10:00:06Z [FATAL] Process aborted unexpectedly.
    `;
    const result = RuleBasedLogAnalyzer.analyze(unknownLog);

    expect(result.signatureId).toBe('GENERIC_RUNTIME_FAILURE');
    expect(result.matchedLines?.length).toBeGreaterThan(0);
  });
});
