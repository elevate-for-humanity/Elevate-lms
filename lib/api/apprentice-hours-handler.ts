/**
 * Shared handler for apprentice hours logging across disciplines.
 * Used by cosmetology, nail-tech, and esthetician API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export async function handleLogHours(request: NextRequest, discipline: string) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const body = await request.json();
    const { date, hours, minutes = 0, category, notes } = body;

    if (!date || !hours || hours <= 0) return safeError('Invalid hours entry', 400);
    if (hours > 16) return safeError('Cannot log more than 16 hours in a single entry', 400);

    const totalMinutes = Math.round((parseFloat(hours) * 60) + parseInt(minutes));

    const { error } = await supabase
      .from('apprentice_hours')
      .insert({
        user_id: user.id,
        discipline,
        date,
        hours: parseFloat(hours),
        minutes: parseInt(minutes),
        total_minutes: totalMinutes,
        category: category || 'practical',
        notes: notes || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });

    if (error) {
      logger.error(`[pwa/${discipline}/log-hours] insert error`, error);
      return safeError('Failed to save hours. Please try again.', 500);
    }

    logger.info(`[pwa/${discipline}/log-hours] hours logged`, { user_id: user.id, date, hours, discipline });
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to log hours');
  }
}
