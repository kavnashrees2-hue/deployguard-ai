import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { SAMPLE_PROFILES } from '@/lib/db/dynamicProfiles';

export async function GET() {
  return NextResponse.json({
    success: true,
    profiles: SAMPLE_PROFILES
  });
}

export async function POST(request: Request) {
  try {
    let profile = 'default';
    try {
      const body = await request.json();
      if (body && body.profile) {
        profile = body.profile;
      }
    } catch {
      // Body may be empty, default to 'default'
    }

    const result = await DataStore.resetToInitialData(profile);
    const profileMeta = SAMPLE_PROFILES.find((p) => p.id === result.profile) || {
      name: result.profile,
      description: 'Custom profile dataset'
    };

    return NextResponse.json({
      success: true,
      message: `Database seeded with profile: ${profileMeta.name}`,
      profile: result.profile,
      deploymentsCount: result.count,
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
