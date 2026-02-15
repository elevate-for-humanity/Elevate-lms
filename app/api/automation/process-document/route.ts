import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

// Document processing moved to Netlify function to reduce bundle size
export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  return NextResponse.json(
    { error: 'Document processing temporarily unavailable' },
    { status: 503 }
  );
}
