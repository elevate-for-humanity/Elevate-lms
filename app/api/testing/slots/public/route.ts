/**
 * GET /api/testing/slots/public
 *
 * Returns upcoming available testing slots for a given exam type.
 * Public — no auth required. Only returns slots with remaining capacity.
 *
 * Query params:
 *   examType — filter by exam_type (e.g. 'nha', 'CCMA'). Optional — returns all if omitted.
 *
 * Returns: { slots: Slot[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  const examType = req.nextUrl.searchParams.get('examType');

  try {
    // Fetch slots with remaining capacity — filter column-vs-column in JS
    // since Supabase REST doesn't support column comparisons in .filter()
    let query = db
      .from('testing_slots')
      .select('id, exam_type, start_time, end_time, capacity, booked_count, location, notes')
      .eq('is_cancelled', false)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(60);

    // Filter by exam type if provided
    if (examType) {
      query = query.or(`exam_type.eq.${examType},exam_type.ilike.%${examType}%`);
    }

    const { data, error } = await query;
    if (error) return safeInternalError(error, 'Failed to fetch slots');

    // Compute remaining seats server-side and filter out full slots
    const slots = (data ?? [])
      .filter(s => s.booked_count < s.capacity)
      .map(s => ({
        id: s.id,
        examType: s.exam_type,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        notes: s.notes,
        spotsRemaining: Math.max(0, s.capacity - s.booked_count),
      }))
      .slice(0, 30);

    return NextResponse.json({ slots });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch slots');
  }
}
