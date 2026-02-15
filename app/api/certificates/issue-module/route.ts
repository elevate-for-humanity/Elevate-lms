import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Certificate issuance moved to reduce bundle size
export async function POST(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;
return NextResponse.json(
    { error: 'Certificate issuance temporarily unavailable' },
    { status: 503 }
  );
}
