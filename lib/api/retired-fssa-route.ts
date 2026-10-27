import { NextResponse } from 'next/server';

export function retiredFssaResponse() {
  return NextResponse.json(
    {
      error: 'FSSA SNAP E&T routes have been retired',
      message: 'Use the canonical workforce case-management APIs.',
    },
    { status: 410 },
  );
}
