import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';

export async function POST() {
  try {
    const result = await DataStore.resetToInitialData();
    return NextResponse.json({
      success: true,
      message: 'Database reset and seeded with production sample data',
      isMongo: result.isMongo
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
