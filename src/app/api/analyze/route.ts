import { NextRequest, NextResponse } from 'next/server';
import { RuleBasedLogAnalyzer } from '@/lib/analyzer/ruleEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawLogs = body.rawLogs || '';
    const apiKey = body.apiKey || process.env.GEMINI_API_KEY || '';

    if (!rawLogs || typeof rawLogs !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawLogs string is required' },
        { status: 400 }
      );
    }

    const result = await RuleBasedLogAnalyzer.analyzeWithOptionalAI(rawLogs, apiKey);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analyzedLengthChars: rawLogs.length,
        engine: result.analysisEngine,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error during log analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Internal log analysis failure' },
      { status: 500 }
    );
  }
}
