import { NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/authGuards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU PDF generation moved to reduce bundle size
export async function GET() {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable', message: 'Please contact support for MOU documents' },
    { status: 503 }
  );
}
