import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Runtime API-key updates are disabled',
      message: 'Configure SENDGRID_API_KEY in the protected deployment environment.',
    },
    { status: 410 },
  );
}
