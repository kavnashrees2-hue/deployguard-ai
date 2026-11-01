import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deployment = await DataStore.getDeploymentById(id);

    if (!deployment) {
      return NextResponse.json(
        { success: false, error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deployment });
  } catch (error) {
    console.error('Error fetching deployment:', error);
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
    const updated = await DataStore.updateDeployment(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Deployment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating deployment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
