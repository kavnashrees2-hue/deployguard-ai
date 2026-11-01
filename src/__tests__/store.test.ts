import { describe, it, expect } from 'vitest';
import { DataStore } from '../lib/db/store';

describe('DataStore Tests (In-Memory Fallback & Metrics)', () => {
  it('should retrieve initial seeded deployments', async () => {
    const deployments = await DataStore.getDeployments();
    expect(deployments.length).toBeGreaterThanOrEqual(5);
    expect(deployments.some((d) => d.id === 'dep-901')).toBe(true);
  });

  it('should filter deployments by environment', async () => {
    const prodDeps = await DataStore.getDeployments({ environment: 'production' });
    expect(prodDeps.every((d) => d.environment === 'production')).toBe(true);
  });

  it('should filter deployments by status', async () => {
    const failedDeps = await DataStore.getDeployments({ status: 'FAILED' });
    expect(failedDeps.every((d) => d.status === 'FAILED')).toBe(true);
  });

  it('should compute valid system metrics', async () => {
    const metrics = await DataStore.getMetrics();
    expect(metrics.totalDeployments).toBeGreaterThan(0);
    expect(metrics.successRate).toBeGreaterThanOrEqual(0);
    expect(metrics.successRate).toBeLessThanOrEqual(100);
    expect(metrics.activeIncidents).toBeGreaterThanOrEqual(0);
    expect(metrics.categoryBreakdown.INFRASTRUCTURE).toBeDefined();
  });

  it('should perform deployment rollback and record rollbackVersion', async () => {
    const rollback = await DataStore.rollbackDeployment('dep-901');
    expect(rollback).toBeDefined();
    expect(rollback?.status).toBe('ROLLED_BACK');
    expect(rollback?.rollbackVersion).toBeDefined();
  });

  it('should retrieve seeded incidents and support search/severity filters', async () => {
    const incidents = await DataStore.getIncidents();
    expect(incidents.length).toBeGreaterThanOrEqual(3);
    expect(incidents.some((i) => i.id === 'INC-001')).toBe(true);

    const critical = await DataStore.getIncidents({ severity: 'CRITICAL' });
    expect(critical.every((i) => i.severity === 'CRITICAL')).toBe(true);

    const searched = await DataStore.getIncidents({ search: 'recommendation' });
    expect(searched.length).toBeGreaterThan(0);
    expect(searched[0].serviceName).toContain('recommendation');
  });

  it('should create incident and advance lifecycle from OPEN to RESOLVED with resolution', async () => {
    const created = await DataStore.createIncident({
      id: '',
      title: 'Kubernetes Pod Out-Of-Memory',
      error: 'Kubernetes OOMKilled',
      serviceName: 'checkout-service',
      environment: 'production',
      severity: 'CRITICAL',
      status: 'OPEN',
      deploymentId: 'dep-901',
      rootCause: 'Heap limit exceeded',
      category: 'INFRASTRUCTURE',
      assignee: 'oncall.sre',
      recommendedSolution: 'Increase memory limit to 1.5Gi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: []
    });

    expect(created.id).toMatch(/^INC-\d+/);
    expect(created.status).toBe('OPEN');

    // Update to IN_PROGRESS
    const inProgress = await DataStore.updateIncident(created.id, { status: 'IN_PROGRESS' });
    expect(inProgress?.status).toBe('IN_PROGRESS');

    // Update to RESOLVED with resolution
    const resolved = await DataStore.updateIncident(created.id, {
      status: 'RESOLVED',
      resolution: 'Scaled memory limit to 1.5Gi and verified healthy pod restart'
    });
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.resolution).toContain('Scaled memory limit to 1.5Gi');
  });

  it('should auto-remediate a failed deployment and heal it to SUCCESS', async () => {
    const remediated = await DataStore.autoRemediateDeployment('dep-901', 'Scale Pod Memory Limits 512Mi -> 1.5Gi');
    expect(remediated).toBeDefined();
    expect(remediated?.deployment.status).toBe('SUCCESS');
    expect(remediated?.deployment.stages.every((s) => s.status === 'PASSED')).toBe(true);
    expect(remediated?.deployment.rawLogs).toContain('[DEPLOYGUARD AUTO-HEAL INITIATED');
  });

  it('should auto-remediate an incident and resolve it', async () => {
    const res = await DataStore.autoRemediateIncident('INC-001', 'Cleared database migration lock');
    expect(res).toBeDefined();
    expect(res?.incident.status).toBe('RESOLVED');
  });
});
