import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { Incident } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const search = searchParams.get('search') || undefined;

    const incidents = await DataStore.getIncidents({ status, severity, search });

    return NextResponse.json(
      {
        success: true,
        data: incidents
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
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newIncident: Incident = {
      id: body.id || '',
      title: body.title || 'Deployment Regression Incident',
      error: body.error || body.title || 'Unspecified Error',
      serviceName: body.serviceName || 'unknown-service',
      environment: body.environment || 'production',
      severity: body.severity || 'HIGH',
      status: body.status || 'OPEN',
      deploymentId: body.deploymentId || '',
      rootCause: body.rootCause || 'Root cause under investigation.',
      category: body.category || 'APPLICATION',
      assignee: body.assignee || 'oncall.engineer',
      recommendedSolution: body.recommendedSolution || '',
      resolution: body.resolution || '',
      remediationSteps: body.remediationSteps || [],
      rawLogs: body.rawLogs || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: body.timeline || [
        {
          timestamp: new Date().toISOString(),
          message: `Incident declared: ${body.title || 'Deployment issue detected'}`,
          author: body.assignee || 'oncall.engineer'
        }
      ],
      postMortem: body.postMortem
    };

    const saved = await DataStore.createIncident(newIncident);

    return NextResponse.json({
      success: true,
      data: saved
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
