import { NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU signing moved to reduce bundle size
export async function POST() {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  return NextResponse.json(
    { error: 'MOU signing temporarily unavailable', message: 'Please contact support' },
    { status: 503 }
  );
}
