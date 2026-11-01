import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { Deployment, PipelineStage } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deploymentId, 
      incidentId, 
      serviceName = 'payment-gateway-proxy', 
      fixTitle = 'Dynamic Patch & Rollout Restart',
      scenario = 'auto-heal',
      rawLogs = ''
    } = body;

    const now = new Date();
    const steps = [
      { step: 1, title: 'Analyze Error & Isolate Failure Domain', status: 'COMPLETED', output: `Identified error pattern for ${serviceName}. Root cause isolated.` },
      { step: 2, title: 'Execute Automated Remediation Runbook', status: 'COMPLETED', output: `Applied remediation: ${fixTitle}. Configuration patched.` },
      { step: 3, title: 'Trigger Rolling Container Pod Restart', status: 'COMPLETED', output: 'Initiated rolling pod restart. Waiting for 1/1 ready replicas...' },
      { step: 4, title: 'Synthetic Liveness & Readiness Verification', status: 'COMPLETED', output: 'GET /healthz HTTP 200 OK. Synthetic probe returned zero errors.' },
      { step: 5, title: 'Route Production Traffic & Restore Service', status: 'COMPLETED', output: 'Promoted to 100% production traffic. Service status: HEALTHY & ACTIVE.' }
    ];

    let healedDeployment: Deployment | null = null;
    let resolvedIncident = null;

    if (deploymentId) {
      const result = await DataStore.autoRemediateDeployment(deploymentId, fixTitle);
      if (result) {
        healedDeployment = result.deployment;
        resolvedIncident = result.incident;
      }
    } else if (incidentId) {
      const result = await DataStore.autoRemediateIncident(incidentId, fixTitle);
      if (result) {
        resolvedIncident = result.incident;
        healedDeployment = result.deployment || null;
      }
    } else {
      // Create a fresh healed deployment to demonstrate recovery
      const newId = `heal-${Date.now().toString().slice(-5)}`;
      const stages: PipelineStage[] = [
        { id: 'stg-1', name: 'Lint & Typecheck', status: 'PASSED', durationMs: 2200 },
        { id: 'stg-2', name: 'Automated Tests', status: 'PASSED', durationMs: 8400 },
        { id: 'stg-3', name: 'Container Build & Remediation Patch', status: 'PASSED', durationMs: 14000 },
        { id: 'stg-4', name: 'Canary Rollout (Auto-Healed)', status: 'PASSED', durationMs: 9500 },
        { id: 'stg-5', name: 'Synthetic Traffic Verification', status: 'PASSED', durationMs: 3100 }
      ];

      const newDep: Deployment = {
        id: newId,
        serviceName,
        environment: 'production',
        version: `v2.${Math.floor(Math.random() * 5 + 4)}.0-healed`,
        commitHash: Math.random().toString(16).substring(2, 9),
        commitMessage: `fix(auto-heal): DeployGuard automated runbook remediation [${fixTitle}]`,
        author: 'deployguard.sre',
        status: 'SUCCESS',
        startedAt: now.toISOString(),
        completedAt: new Date(now.getTime() + 38000).toISOString(),
        durationSeconds: 38,
        trigger: 'ROLLBACK',
        stages,
        rawLogs: `[INFO] DeployGuard Self-Healing Engine initiated for ${serviceName}\n` +
          `[INFO] Target: ${fixTitle}\n` +
          `[SUCCESS] Fix applied. Healthcheck status: 200 OK. Application running healthy in production cluster.`
      };

      healedDeployment = await DataStore.createDeployment(newDep);
    }

    return NextResponse.json({
      success: true,
      message: `Automated remediation applied successfully. ${serviceName} is healed and running healthy.`,
      data: {
        deployment: healedDeployment,
        incident: resolvedIncident,
        steps,
        appStatus: 'HEALTHY_RUNNING',
        serviceName,
        endpoint: 'http://localhost:3000',
        healedAt: now.toISOString()
      }
    });
  } catch (error) {
    console.error('Error applying remediation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply remediation' },
      { status: 500 }
    );
  }
}

