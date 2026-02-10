import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';

export const dynamic = 'force-dynamic';

// Document processing moved to Netlify function to reduce bundle size
export async function POST() {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
  return NextResponse.json(
    { error: 'Document processing temporarily unavailable' },
    { status: 503 }
  );
}
