import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { Deployment, PipelineStage } from '@/lib/types';
import { SAMPLE_LOG_PRESETS } from '@/lib/analyzer/sampleLogs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario = body.scenario || 'oom_crash'; // 'healthy' | 'oom_crash' | 'db_lock' | 'port_conflict' | 'tls_expired'
    const serviceName = body.serviceName || 'payment-gateway-proxy';

    let status: Deployment['status'] = 'SUCCESS';
    let failureReason: string | undefined = undefined;
    let rawLogs = '';
    let stages: PipelineStage[] = [];

    const now = new Date();
    const id = `sim-${Date.now().toString().slice(-5)}`;

    if (scenario === 'healthy') {
      status = 'SUCCESS';
      rawLogs = `[INFO] Pipeline initiated for branch main.\n[INFO] Tests passed: 42/42.\n[INFO] Docker image built successfully.\n[INFO] Deployment passed healthchecks.`;
      stages = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 3200 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 14500 },
        { id: 'stg-3', name: 'Container Build', status: 'PASSED', durationMs: 28000 },
        { id: 'stg-4', name: 'Database Migration', status: 'PASSED', durationMs: 6500 },
        { id: 'stg-5', name: 'Canary Rollout', status: 'PASSED', durationMs: 21000 },
        { id: 'stg-6', name: 'Traffic Promotion', status: 'PASSED', durationMs: 5000 }
      ];
    } else if (scenario === 'oom_crash') {
      status = 'FAILED';
      const preset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'k8s-oom-killed')!;
      rawLogs = preset.logContent;
      failureReason = 'Kubernetes Pod Out-Of-Memory (OOMKilled, Exit Code 137)';
      stages = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 3100 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 12000 },
        { id: 'stg-3', name: 'Container Build', status: 'PASSED', durationMs: 25000 },
        { id: 'stg-4', name: 'Database Migration', status: 'PASSED', durationMs: 4000 },
        { id: 'stg-5', name: 'Canary Rollout', status: 'FAILED', durationMs: 15400, errorMessage: 'Container terminated with Exit Code 137 (OOMKilled)' },
        { id: 'stg-6', name: 'Traffic Promotion', status: 'SKIPPED' }
      ];
    } else if (scenario === 'db_lock') {
      status = 'FAILED';
      const preset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'db-migration-lock')!;
      rawLogs = preset.logContent;
      failureReason = 'Database Migration Advisory Lock Timeout on schema_migrations';
      stages = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 3400 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 11000 },
        { id: 'stg-3', name: 'Database Migration', status: 'FAILED', durationMs: 45000, errorMessage: 'Timed out waiting for advisory lock on postgres connection' },
        { id: 'stg-4', name: 'Container Build', status: 'SKIPPED' },
        { id: 'stg-5', name: 'Canary Rollout', status: 'SKIPPED' },
        { id: 'stg-6', name: 'Traffic Promotion', status: 'SKIPPED' }
      ];
    } else if (scenario === 'tls_expired') {
      status = 'FAILED';
      const preset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'tls-cert-expired')!;
      rawLogs = preset.logContent;
      failureReason = 'TLS Certificate Expired (CERT_HAS_EXPIRED)';
      stages = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 2800 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 9000 },
        { id: 'stg-3', name: 'Container Build', status: 'PASSED', durationMs: 22000 },
        { id: 'stg-4', name: 'Canary Rollout', status: 'FAILED', durationMs: 18000, errorMessage: 'SSL routines:certificate verify failed: certificate has expired' },
        { id: 'stg-5', name: 'Traffic Promotion', status: 'SKIPPED' }
      ];
    } else {
      // Default port conflict
      status = 'FAILED';
      const preset = SAMPLE_LOG_PRESETS.find((p) => p.id === 'port-eaddrinuse')!;
      rawLogs = preset.logContent;
      failureReason = 'Port Collision (EADDRINUSE 8080)';
      stages = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 2900 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 10200 },
        { id: 'stg-3', name: 'Container Build', status: 'PASSED', durationMs: 24000 },
        { id: 'stg-4', name: 'Canary Rollout', status: 'FAILED', durationMs: 8200, errorMessage: 'Error: listen EADDRINUSE: address already in use 0.0.0.0:8080' },
        { id: 'stg-5', name: 'Traffic Promotion', status: 'SKIPPED' }
      ];
    }

    const newDep: Deployment = {
      id,
      serviceName,
      environment: 'production',
      version: `v${Math.floor(Math.random() * 4 + 2)}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`,
      commitHash: Math.random().toString(16).substring(2, 9),
      commitMessage: `test(sim): live pipeline simulation [${scenario}]`,
      author: 'demo.presenter',
      status,
      startedAt: now.toISOString(),
      completedAt: new Date(now.getTime() + 45000).toISOString(),
      durationSeconds: 45,
      trigger: 'MANUAL_CLI',
      stages,
      rawLogs,
      failureReason
    };

    // If failed, auto-create an incident too
    if (status === 'FAILED') {
      const incId = `inc-${Date.now().toString().slice(-4)}`;
      newDep.incidentId = incId;
      await DataStore.createIncident({
        id: incId,
        title: `Pipeline Failure: ${newDep.serviceName} (${scenario})`,
        serviceName: newDep.serviceName,
        environment: 'production',
        severity: scenario === 'oom_crash' || scenario === 'tls_expired' ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        deploymentId: id,
        rootCause: failureReason || 'Pipeline simulation failure detected',
        category: scenario === 'oom_crash' ? 'INFRASTRUCTURE' : scenario === 'db_lock' ? 'DATABASE' : scenario === 'tls_expired' ? 'SECURITY' : 'CONFIGURATION',
        assignee: 'demo.presenter',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        timeline: [
          {
            timestamp: now.toISOString(),
            message: `DeployGuard AI automatically detected pipeline crash: ${failureReason}`,
            author: 'DeployGuard System'
          }
        ]
      });
    }

    await DataStore.createDeployment(newDep);

    return NextResponse.json({
      success: true,
      data: newDep,
      message: `Simulated deployment '${scenario}' executed successfully`
    });
  } catch (error) {
    console.error('Error executing pipeline simulation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to simulate pipeline' },
      { status: 500 }
    );
  }
}
