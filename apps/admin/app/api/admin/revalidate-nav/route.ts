/**
 * POST /api/admin/revalidate-nav
 *
 * Busts the cached nav sections so the next layout render re-fetches
 * from platform_settings. Call this after saving ADMIN_NAV_SECTIONS_JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  revalidateTag('admin-nav-sections');
  return NextResponse.json({ revalidated: true });
}
