import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await DataStore.getIncidentById(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await DataStore.getIncidentById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const updates = { ...body };
    if (body.newTimelineMessage) {
      const updatedTimeline = [
        ...existing.timeline,
        {
          timestamp: new Date().toISOString(),
          message: body.newTimelineMessage,
          author: body.author || 'devops.admin'
        }
      ];
      updates.timeline = updatedTimeline;
      delete updates.newTimelineMessage;
      delete updates.author;
    }

    if (body.status === 'RESOLVED') {
      if (!existing.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
      }
      if (body.resolution) {
        updates.resolution = body.resolution;
      }
    }

    const updated = await DataStore.updateIncident(id, updates);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
