import { NextResponse } from 'next/server';
import { ChaosNode, Incident } from '@/lib/types';
import { INITIAL_CHAOS_NODES, CHAOS_SCENARIOS } from '@/lib/chaos/chaosData';
import { DataStore } from '@/lib/db/store';

interface ChaosLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

const globalForChaos = global as typeof globalThis & {
  _chaosNodes?: ChaosNode[];
  _activeScenarioId?: string | null;
  _chaosLogs?: ChaosLogEntry[];
  _activeIncidentId?: string | null;
};

if (!globalForChaos._chaosNodes) {
  globalForChaos._chaosNodes = JSON.parse(JSON.stringify(INITIAL_CHAOS_NODES));
  globalForChaos._activeScenarioId = null;
  globalForChaos._activeIncidentId = null;
  globalForChaos._chaosLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Resilience Topology Sandbox initialized. All 6 microservices healthy.'
    }
  ];
}

export async function GET() {
  const nodes = globalForChaos._chaosNodes || JSON.parse(JSON.stringify(INITIAL_CHAOS_NODES));
  const activeScenarioId = globalForChaos._activeScenarioId || null;
  const logs = globalForChaos._chaosLogs || [];

  const hasDown = nodes.some((n: ChaosNode) => n.status === 'DOWN');
  const hasDegraded = nodes.some((n: ChaosNode) => n.status === 'DEGRADED');

  const systemStatus = hasDown ? 'CRITICAL' : hasDegraded ? 'DEGRADED' : 'HEALTHY';

  return NextResponse.json({
    nodes,
    scenarios: CHAOS_SCENARIOS,
    activeScenario: CHAOS_SCENARIOS.find((s) => s.id === activeScenarioId) || null,
    systemStatus,
    logs: logs.slice(-20),
    activeIncidentId: globalForChaos._activeIncidentId || null
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, scenarioId } = body;
    const now = new Date().toISOString();

    if (action === 'inject') {
      const scenario = CHAOS_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
      }

      // Reset first to clean state then apply fault
      const freshNodes: ChaosNode[] = JSON.parse(JSON.stringify(INITIAL_CHAOS_NODES));

      // Degrade blast radius
      const updatedNodes = freshNodes.map((node) => {
        if (node.id === scenario.targetService) {
          return {
            ...node,
            status: 'DOWN' as const,
            latencyMs: node.latencyMs * 18,
            errorRate: 0.85,
            activeReplicas: '0/4 (CrashLoopBackOff)'
          };
        } else if (scenario.blastRadius.includes(node.id)) {
          return {
            ...node,
            status: 'DEGRADED' as const,
            latencyMs: node.latencyMs * 5,
            errorRate: 0.28,
            activeReplicas: 'Partial Failure'
          };
        }
        return node;
      });

      globalForChaos._chaosNodes = updatedNodes;
      globalForChaos._activeScenarioId = scenario.id;

      // Create an Incident in the Store so it syncs with DeployGuard Triage
      let incidentCategory: any = 'RESOURCE_LIMIT';
      if (scenario.faultType === 'CERTIFICATE_EXPIRY') incidentCategory = 'CONFIGURATION_ERROR';
      if (scenario.faultType === 'POOL_STARVATION') incidentCategory = 'DATABASE_ERROR';
      if (scenario.faultType === 'PORT_CONFLICT') incidentCategory = 'INFRASTRUCTURE';
      if (scenario.faultType === 'CACHE_STAMPEDE') incidentCategory = 'NETWORK_TIMEOUT';

      const incident: Incident = {
        id: `INC-CHAOS-${Date.now().toString().slice(-4)}`,
        title: `Chaos Fault: ${scenario.name} on ${scenario.targetService}`,
        serviceName: scenario.targetService,
        environment: 'production',
        status: 'INVESTIGATING',
        severity: 'CRITICAL',
        category: incidentCategory,
        deploymentId: 'DEP-CHAOS-001',
        assignee: 'SRE On-Call Bot',
        rootCause: scenario.description,
        recommendedSolution: `${scenario.remediationTitle}: ${scenario.remediationCommand}`,
        timeline: [
          {
            timestamp: now,
            message: `Chaos engineering scenario [${scenario.id}] injected. Target: ${scenario.targetService}`,
            author: 'Chaos Engineering Engine'
          },
          {
            timestamp: now,
            message: `Anomaly detected by DeployGuard Triage. Blast radius: ${scenario.blastRadius.join(', ')}`,
            author: 'DeployGuard SRE Sentinel'
          }
        ],
        createdAt: now,
        updatedAt: now
      };

      try {
        await DataStore.createIncident(incident);
        globalForChaos._activeIncidentId = incident.id;
      } catch (e) {
        console.warn('Could not persist incident to store:', e);
      }

      // Append logs
      globalForChaos._chaosLogs = globalForChaos._chaosLogs || [];
      globalForChaos._chaosLogs.push(
        {
          timestamp: now,
          level: 'ERROR',
          message: `[CHAOS INJECTED] ${scenario.name} targeting ${scenario.targetService}`
        },
        {
          timestamp: now,
          level: 'WARN',
          message: `Cascading degradation detected across: ${scenario.blastRadius.join(', ')}`
        }
      );

      return NextResponse.json({
        success: true,
        nodes: globalForChaos._chaosNodes,
        activeScenario: scenario,
        systemStatus: 'CRITICAL',
        incidentId: incident.id,
        logs: (globalForChaos._chaosLogs || []).slice(-20)
      });
    }

    if (action === 'heal') {
      const activeScenario = CHAOS_SCENARIOS.find((s) => s.id === globalForChaos._activeScenarioId);
      const remediationTitle = activeScenario?.remediationTitle || 'Automated Dynamic Microservice Healing';

      // Restore nodes to healthy
      globalForChaos._chaosNodes = JSON.parse(JSON.stringify(INITIAL_CHAOS_NODES));
      globalForChaos._activeScenarioId = null;

      // If active incident exists, resolve it in the DB store
      if (globalForChaos._activeIncidentId) {
        try {
          await DataStore.autoRemediateIncident(
            globalForChaos._activeIncidentId,
            `Chaos self-healing completed: ${remediationTitle}. Microservices verified 200 OK.`
          );
        } catch (e) {
          console.warn('Could not auto-remediate chaos incident:', e);
        }
        globalForChaos._activeIncidentId = null;
      }

      globalForChaos._chaosLogs = globalForChaos._chaosLogs || [];
      globalForChaos._chaosLogs.push(
        {
          timestamp: now,
          level: 'INFO',
          message: `[DEPLOYGUARD AUTONOMOUS HEALING] Runbook triggered: ${remediationTitle}`
        },
        {
          timestamp: now,
          level: 'SUCCESS',
          message: `Service mesh stabilized. Latency and error rates returned to 0% baseline (HTTP 200 OK).`
        }
      );

      return NextResponse.json({
        success: true,
        nodes: globalForChaos._chaosNodes,
        activeScenario: null,
        systemStatus: 'HEALTHY',
        logs: (globalForChaos._chaosLogs || []).slice(-20)
      });
    }

    if (action === 'reset') {
      globalForChaos._chaosNodes = JSON.parse(JSON.stringify(INITIAL_CHAOS_NODES));
      globalForChaos._activeScenarioId = null;
      globalForChaos._activeIncidentId = null;
      globalForChaos._chaosLogs = [
        {
          timestamp: now,
          level: 'INFO',
          message: 'Chaos Resilience Topology reset to baseline. All services healthy.'
        }
      ];

      return NextResponse.json({
        success: true,
        nodes: globalForChaos._chaosNodes,
        activeScenario: null,
        systemStatus: 'HEALTHY',
        logs: globalForChaos._chaosLogs
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chaos API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
