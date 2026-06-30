// Barber training session management
// POST /api/barber/session        — start a session
// PATCH /api/barber/session       — heartbeat (keep-alive + activity signals)
// DELETE /api/barber/session      — end session, credit hours

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { canCreditTheoryHoursForDate } from '@/lib/beauty-apprenticeship/check-daily-theory-credit';
import { dailyTheoryBlockedMessage } from '@/lib/beauty-apprenticeship/daily-theory';
import { DAILY_THEORY_PASSING_SCORE } from '@/lib/beauty-apprenticeship/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_PROGRAM_ID = process.env.BARBER_PROGRAM_ID ?? '';
const IDLE_TIMEOUT_SECONDS = 300; // 5 min idle = session paused
// Theory credit rate: 1 hour of active session = 1 theory hour (capped by module)
const THEORY_CREDIT_RATE = 1.0;

// Module theory caps (mirrors migration data)
const MODULE_THEORY_CAPS: Record<number, number> = {
  1: 150,
  2: 150,
  3: 100,
  4: 100,
  5: 50,
  6: 100,
  7: 90,
  8: 100,
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const { module_number, lesson_id } = await request.json();
    if (!module_number || module_number < 1 || module_number > 8) {
      return safeError('module_number 1–8 required', 400);
    }

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    // Abandon any existing active session for this user
    await db
      .from('barber_training_sessions')
      .update({ status: 'abandoned', ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { data: session, error } = await db
      .from('barber_training_sessions')
      .insert({
        user_id: user.id,
        program_id: BARBER_PROGRAM_ID,
        module_number,
        lesson_id: lesson_id ?? null,
        status: 'active',
      })
      .select('id, started_at')
      .single();

    if (error) return safeInternalError(error, 'Failed to start session');
    return NextResponse.json({ session_id: session.id, started_at: session.started_at });
  } catch (err) {
    return safeInternalError(err, 'Failed to start session');
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const { session_id, video_seconds, clicks } = await request.json();
    if (!session_id) return safeError('session_id required', 400);

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const { data: session } = await db
      .from('barber_training_sessions')
      .select('id, user_id, last_heartbeat_at, idle_seconds, heartbeat_count')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!session) return safeError('Active session not found', 404);

    const now = new Date();
    const lastBeat = new Date(session.last_heartbeat_at);
    const gapSeconds = Math.floor((now.getTime() - lastBeat.getTime()) / 1000);
    const additionalIdle = gapSeconds > IDLE_TIMEOUT_SECONDS ? gapSeconds : 0;

    await db
      .from('barber_training_sessions')
      .update({
        last_heartbeat_at: now.toISOString(),
        idle_seconds: session.idle_seconds + additionalIdle,
        heartbeat_count: session.heartbeat_count + 1,
        video_watch_seconds: db.rpc ? undefined : undefined, // incremented below
        click_count: (session as any).click_count + (clicks ?? 0),
      })
      .eq('id', session_id);

    if (video_seconds) {
      await Promise.resolve(
        db.rpc('increment_session_video', { p_session_id: session_id, p_seconds: video_seconds })
      ).then(() => {}).catch(() => {}); // non-critical
    }

    return NextResponse.json({ ok: true, idle_gap: additionalIdle });
  } catch (err) {
    return safeInternalError(err, 'Heartbeat failed');
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    const { session_id } = await request.json();
    if (!session_id) return safeError('session_id required', 400);

    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const { data: session } = await db
      .from('barber_training_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!session) return safeError('Active session not found', 404);

    const now = new Date();
    const rawSeconds = Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000);
    const activeSeconds = Math.max(0, rawSeconds - (session.idle_seconds ?? 0));
    const activeHours = parseFloat((activeSeconds / 3600).toFixed(2));

    // Cap theory credit at module cap minus already-credited theory
    const { data: ledger } = await db
      .from('barber_hour_ledger')
      .select(`mod${session.module_number}_theory`)
      .eq('user_id', user.id)
      .eq('program_id', BARBER_PROGRAM_ID)
      .maybeSingle();

    const currentTheory = (ledger as any)?.[`mod${session.module_number}_theory`] ?? 0;
    const cap = MODULE_THEORY_CAPS[session.module_number] ?? 100;
    let theoryCredited = Math.min(
      activeHours * THEORY_CREDIT_RATE,
      Math.max(0, cap - currentTheory),
    );

    const dailyGate = await canCreditTheoryHoursForDate(
      db,
      user.id,
      'barber-apprenticeship',
    );
    if (!dailyGate.allowed) {
      theoryCredited = 0;
    }

    // Update session record
    await db
      .from('barber_training_sessions')
      .update({
        status: 'completed',
        ended_at: now.toISOString(),
        active_seconds: activeSeconds,
        theory_hours_credited: theoryCredited,
        practical_hours_credited: 0, // practical hours come from instructor approval only
      })
      .eq('id', session_id);

    // Credit theory hours to ledger
    if (theoryCredited > 0) {
      const modCol = `mod${session.module_number}_theory`;
      await db.from('barber_hour_ledger').upsert(
        {
          user_id: user.id,
          program_id: BARBER_PROGRAM_ID,
          [modCol]: theoryCredited,
          theory_hours: theoryCredited,
          total_hours: theoryCredited,
          last_session_start: session.started_at,
          last_session_end: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'user_id,program_id',
          ignoreDuplicates: false,
        },
      );

      // Audit event
      await db.from('barber_hour_events').insert({
        user_id: user.id,
        program_id: BARBER_PROGRAM_ID,
        module_number: session.module_number,
        hour_type: 'theory',
        hours_credited: theoryCredited,
        source: 'session',
        source_id: session_id,
      });
    }

    return NextResponse.json({
      active_seconds: activeSeconds,
      theory_hours_credited: theoryCredited,
      practical_hours_credited: 0,
      daily_theory_required: !dailyGate.allowed,
      daily_theory_passing_score: DAILY_THEORY_PASSING_SCORE,
      daily_theory_best_score: dailyGate.bestScore,
      daily_theory_message: dailyGate.allowed ? null : dailyTheoryBlockedMessage(dailyGate.bestScore ?? undefined),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to end session');
  }
}
