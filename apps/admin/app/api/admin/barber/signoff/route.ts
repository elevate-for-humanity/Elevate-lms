// Instructor: issue a module competency or hour-block sign-off
// POST /api/admin/barber/signoff
// pre-auth-registry: exempt — route requires apiRequireInstructor; all writes are post-auth.

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireInstructor } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_PROGRAM_ID = process.env.BARBER_PROGRAM_ID ?? '';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireInstructor(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      user_id,
      signoff_type,
      module_number,
      hours_verified,
      hour_type,
      period_start,
      period_end,
      performance_rating,
      notes,
      conditions,
    } = body;

    if (!user_id) return safeError('user_id required', 400);
    if (!signoff_type) return safeError('signoff_type required', 400);

    if (signoff_type === 'module_competency' && !module_number) {
      return safeError('module_number required for module_competency signoff', 400);
    }
    if (signoff_type === 'hour_block' && (!hours_verified || !hour_type)) {
      return safeError('hours_verified and hour_type required for hour_block signoff', 400);
    }

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const { data: signoff, error } = await db
      .from('barber_instructor_signoffs')
      .insert({
        user_id,
        program_id: BARBER_PROGRAM_ID,
        approved_by: auth.id,
        signoff_type,
        module_number: module_number ?? null,
        hours_verified: hours_verified ?? null,
        hour_type: hour_type ?? null,
        period_start: period_start ?? null,
        period_end: period_end ?? null,
        performance_rating: performance_rating ?? 'satisfactory',
        notes: notes ?? null,
        conditions: conditions ?? null,
        status: conditions ? 'conditional' : 'approved',
      })
      .select('id, signoff_type, module_number, status, signed_at')
      .single();

    if (error) return safeDbError(error, 'Failed to create signoff');

    // If hour_block signoff, credit practical hours to ledger
    if (
      signoff_type === 'hour_block' &&
      hour_type === 'practical' &&
      hours_verified &&
      module_number
    ) {
      const modCol = `mod${module_number}_practical`;
      await db.from('barber_hour_ledger').upsert(
        {
          user_id,
          program_id: BARBER_PROGRAM_ID,
          [modCol]: hours_verified,
          practical_hours: hours_verified,
          total_hours: hours_verified,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,program_id', ignoreDuplicates: false },
      );

      await db.from('barber_hour_events').insert({
        user_id,
        program_id: BARBER_PROGRAM_ID,
        module_number,
        hour_type: 'practical',
        hours_credited: hours_verified,
        source: 'instructor_manual',
        source_id: signoff.id,
        credited_by: auth.id,
        notes,
      });
    }

    return NextResponse.json({ signoff }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create signoff');
  }
}
