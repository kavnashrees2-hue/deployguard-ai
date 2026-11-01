import { NextRequest, NextResponse } from 'next/server';
import { PreFlightEngine } from '@/lib/analyzer/preFlightEngine';
import { PreFlightCheckRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: PreFlightCheckRequest = await request.json();

    if (!body.serviceName || !body.commitMessage) {
      return NextResponse.json(
        { success: false, error: 'serviceName and commitMessage are required' },
        { status: 400 }
      );
    }

    const assessment = PreFlightEngine.assess(body);

    return NextResponse.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error running pre-flight check:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate pre-flight check' },
      { status: 500 }
    );
  }
}

