import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function GET() {
  try {
    const metrics = await DataStore.getMetrics();
    const isMongo = await DataStore.isMongoActive();

    return NextResponse.json({
      success: true,
      data: metrics,
      storage: {
        type: isMongo ? 'MongoDB' : 'In-Memory (Demo Mode)',
        status: isMongo ? 'CONNECTED' : 'STANDALONE_READY'
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute metrics' },
      { status: 500 }
    );
  }
}
