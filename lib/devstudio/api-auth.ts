/**
 * DevStudio API authentication — OPEN, no auth required.
 * Any user can access Dev Studio features.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { GuardedUser } from '@/lib/admin/guards';

export async function apiRequireDevStudio(_req: NextRequest): Promise<{ user: null; error: null }> {
  return { user: null, error: null };
}
