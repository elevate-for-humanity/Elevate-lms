import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Document processing moved to Netlify function to reduce bundle size
export async function POST() {
  return NextResponse.json(
    { error: 'Document processing temporarily unavailable' },
    { status: 503 }
  );
}
