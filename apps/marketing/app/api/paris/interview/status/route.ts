import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const retired = () =>
  NextResponse.json(
    {
      error: 'Legacy interview status route retired',
      message: 'Use the authenticated PARIS interview session API.',
    },
    { status: 410 },
  );

export const GET = retired;
export const PUT = retired;
