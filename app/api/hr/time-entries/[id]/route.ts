export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch (error) { /* Error handled silently */ 
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('time_entries').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Time entry deleted' });
  } catch (error) { /* Error handled silently */ 
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
