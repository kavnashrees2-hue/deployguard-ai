import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function GET(request: Request) {
  try {
    // Reading request URL or searchParams makes Next.js treat the route as dynamic
    const { searchParams } = new URL(request.url);
    const _t = searchParams.get('t');

    const metrics = await DataStore.getMetrics();
    const isMongo = await DataStore.isMongoActive();

    return NextResponse.json(
      {
        success: true,
        data: metrics,
        storage: {
          type: isMongo ? 'MongoDB' : 'In-Memory (Demo Mode)',
          status: isMongo ? 'CONNECTED' : 'STANDALONE_READY'
        }
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
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute metrics' },
      { status: 500 }
    );
  }
}
