import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rolledBack = await DataStore.rollbackDeployment(id);

    if (!rolledBack) {
      return NextResponse.json(
        { success: false, error: 'Deployment not found or already healthy' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rollback triggered successfully to ${rolledBack.rollbackVersion}`,
      data: rolledBack
    });
  } catch (error) {
    console.error('Error triggering rollback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger rollback' },
      { status: 500 }
    );
  }
}
