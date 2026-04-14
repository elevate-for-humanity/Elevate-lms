import { apiRequireAdmin } from '@/lib/admin/guards';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const { clock_in, clock_out, break_minutes, lunch_minutes, status, notes } =
      body;

    const update: any = {
      clock_in,
      clock_out,
      break_minutes,
      lunch_minutes,
      status,
      notes,
    };

    // recompute hours if both provided
    if (clock_in && clock_out) {
      const start = new Date(clock_in).getTime();
      const end = new Date(clock_out).getTime();
      const diffMs = end - start;
      const diffHours = diffMs / 1000 / 60 / 60;
      const regHours = Math.max(
        0,
        diffHours - (break_minutes || 0 + (lunch_minutes || 0)) / 60
      );
      update.regular_hours = regHours;
      update.total_hours = regHours;
    }

    const { data, error }: any = await supabase
      .from('time_entries')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ timeEntry: data });
  } catch (error) { 
    logger.error(
      'Error updating time entry:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to update time entry' },
      { status: 500 }
    );
  }
}

async function _DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('time_entries').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Time entry deleted' });
  } catch (error) { 
    logger.error(
      'Error deleting time entry:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to delete time entry' },
      { status: 500 }
    );
  }
}
export const PATCH = withApiAudit('/api/hr/time-entries/[id]', _PATCH);
export const DELETE = withApiAudit('/api/hr/time-entries/[id]', _DELETE);
