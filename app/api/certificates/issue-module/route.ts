import { NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Certificate issuance moved to reduce bundle size
export async function POST() {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  return NextResponse.json(
    { error: 'Certificate issuance temporarily unavailable' },
    { status: 503 }
  );
}
