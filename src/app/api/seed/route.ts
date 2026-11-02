import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/db/store';
import { SAMPLE_PROFILES, getNextProfile } from '@/lib/db/dynamicProfiles';

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      profiles: SAMPLE_PROFILES
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    }
  );
}

export async function POST(request: Request) {
  try {
    let profile = '';
    let action = '';

    try {
      const body = await request.json();
      if (body) {
        if (body.profile) profile = body.profile;
        if (body.action) action = body.action;
      }
    } catch {
      // Body may be empty
    }

    if (action === 'reset' || profile === 'reset') {
      profile = 'default';
    } else if (!profile || profile === 'next' || profile === 'cycle' || profile === 'random_switch') {
      profile = getNextProfile();
    }

    const result = await DataStore.resetToInitialData(profile);
    const profileMeta = SAMPLE_PROFILES.find((p) => p.id === result.profile) || {
      name: result.profile,
      description: 'Custom profile dataset'
    };

    return NextResponse.json(
      {
        success: true,
        message: `Database switched to profile: ${profileMeta.name}`,
        profile: result.profile,
        profileName: profileMeta.name,
        deploymentsCount: result.count,
        isMongo: result.isMongo
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
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
