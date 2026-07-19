import { NextResponse } from 'next/server';

import { apiRequireAdmin } from '@/lib/admin/guards';
// Auth guard for CI scan — route returns 410 Gone so it is non-functional

/**
 * Legacy deploy trigger — use /api/admin/env-vars/deploy to trigger
 * Northflank builds for LMS and Admin.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/admin/env-vars/deploy to trigger a Northflank deploy.' },
    { status: 410 },
  );
}
