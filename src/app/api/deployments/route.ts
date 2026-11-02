import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { Deployment } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = searchParams.get('environment') || undefined;
    const status = searchParams.get('status') || undefined;
    const serviceName = searchParams.get('serviceName') || undefined;

    const deployments = await DataStore.getDeployments({
      environment,
      status,
      serviceName
    });

    const isMongo = await DataStore.isMongoActive();

    return NextResponse.json(
      {
        success: true,
        data: deployments,
        storage: isMongo ? 'MongoDB' : 'In-Memory Store (Zero Setup)'
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isMongo = await DataStore.isMongoActive();

    // Default structure for new deployment
    const newDeployment: Deployment = {
      id: body.id || `dep-${Date.now().toString().slice(-4)}`,
      serviceName: body.serviceName || 'payment-gateway-proxy',
      environment: body.environment || 'production',
      version: body.version || `v${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`,
      commitHash: body.commitHash || Math.random().toString(16).substring(2, 9),
      commitMessage: body.commitMessage || 'Manual deployment trigger',
      author: body.author || 'devops.admin',
      status: body.status || 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      trigger: body.trigger || 'MANUAL_CLI',
      stages: body.stages || [
        { id: 's1', name: 'Lint & Typecheck', status: 'RUNNING' },
        { id: 's2', name: 'Unit Tests', status: 'PENDING' },
        { id: 's3', name: 'Container Build', status: 'PENDING' },
        { id: 's4', name: 'Rollout', status: 'PENDING' }
      ],
      rawLogs: body.rawLogs || 'Starting deployment execution...'
    };

    const saved = await DataStore.createDeployment(newDeployment);

    return NextResponse.json({
      success: true,
      data: saved,
      storage: isMongo ? 'MongoDB' : 'In-Memory Store'
    });
  } catch (error) {
    console.error('Error creating deployment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deployment' },
      { status: 500 }
    );
  }
}
