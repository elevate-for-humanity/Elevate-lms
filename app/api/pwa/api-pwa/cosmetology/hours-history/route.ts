/**
 * GET /api/pwa/cosmetology/hours-history
 *
 * Returns all apprentice_hours rows for the authenticated user
 * in the cosmetology discipline, ordered newest first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: rows, error } = await supabase
      .from('apprentice_hours')
      .select('id, date, hours, minutes, category, notes, status, rejection_reason, submitted_at, created_at')
      .eq('user_id', user.id)
      .eq('discipline', 'cosmetology')
      .order('date', { ascending: false })
      .limit(500);

    if (error) {
      logger.error('[cosmetology/hours-history] db error', error);
      return safeError('Failed to load hours history', 500);
    }

    const entries = (rows ?? []).map(r => ({
      id:              r.id,
      date:            r.date,
      hours:           r.hours ?? 0,
      minutes:         r.minutes ?? 0,
      category:        r.category ?? 'practical',
      notes:           r.notes ?? null,
      status:          r.status ?? 'pending',
      rejectionReason: r.rejection_reason ?? null,
      submittedAt:     r.submitted_at ?? r.created_at,
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    return safeInternalError(err, 'Failed to load hours history');
  }
}
