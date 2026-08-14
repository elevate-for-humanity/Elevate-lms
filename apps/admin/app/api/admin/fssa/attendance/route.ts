import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participant_id');
  const weekStart = searchParams.get('week_start');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 1000);

  let query = db
    .from('fssa_attendance')
    .select(
      'id, participant_id, session_date, session_type, hours_attended, present, excused, notes, created_at',
    )
    .order('session_date', { ascending: false })
    .limit(limit);

  if (participantId) query = query.eq('participant_id', participantId);
  if (weekStart) {
    // Return the full week: weekStart through weekStart + 6 days
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    query = query
      .gte('session_date', weekStart)
      .lte('session_date', end.toISOString().split('T')[0]);
  }

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch FSSA attendance');

  // Aggregate weekly hours per participant when week_start is provided
  const records = data ?? [];
  const weeklyTotals: Record<string, number> = {};
  for (const r of records) {
    if (r.present) {
      weeklyTotals[r.participant_id] = (weeklyTotals[r.participant_id] ?? 0) + (r.hours_attended ?? 0);
    }
  }

  return NextResponse.json({ attendance: records, weekly_totals: weeklyTotals });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body?.participant_id || !body?.session_date) {
    return safeError('participant_id and session_date are required', 400);
  }

  const hoursAttended = parseFloat(body.hours_attended ?? 0);
  if (isNaN(hoursAttended) || hoursAttended < 0 || hoursAttended > 24) {
    return safeError('hours_attended must be between 0 and 24', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('fssa_attendance')
    .upsert(
      {
        participant_id: body.participant_id,
        session_date: body.session_date,
        session_type: body.session_type ?? 'training',
        hours_attended: hoursAttended,
        present: body.present ?? true,
        excused: body.excused ?? false,
        notes: body.notes ?? null,
        recorded_by: auth.id,
      },
      { onConflict: 'participant_id,session_date,session_type' },
    )
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to record FSSA attendance');
  return NextResponse.json({ success: true, id: data?.id });
}

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db.from('fssa_attendance').delete().eq('id', id);
  if (error) return safeDbError(error, 'Failed to delete attendance record');

  return NextResponse.json({ success: true });
}
