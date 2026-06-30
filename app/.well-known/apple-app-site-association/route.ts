import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Minimal valid AASA response for iOS Universal Links
// Replace appID(s) and paths when adding real Universal Links
export async function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [
        // Example when you have an iOS app:
        // { appID: "TEAMID.com.elevateforhumanity.app", paths: ["*"] }
      ],
    },
  };

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
