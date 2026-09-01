import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const retired = () =>
  NextResponse.json(
    {
      error: 'FSSA SNAP E&T routes have been retired',
      message: 'Use the canonical workforce case-management APIs.',
    },
    { status: 410 },
  );

export const GET = retired;
export const POST = retired;
export const PATCH = retired;
