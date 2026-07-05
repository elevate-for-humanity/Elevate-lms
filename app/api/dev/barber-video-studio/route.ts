import { NextResponse } from 'next/server';
import { readBarberVideoStudioStatus } from '@/lib/barber/video-studio-status';
import { apiRequireAdmin } from '@/lib/admin/guards';

/**
 * GET /api/dev/barber-video-studio
 * Returns status of barber video generation (no PII)
 * 
 * SECURITY: Admin only, blocked in production
 */
export async function GET() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  // Require admin authentication
  const auth = await apiRequireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(readBarberVideoStudioStatus());
}

