export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  normalizeRapidsStatus,
  canTransitionRapidsStatus,
  type RapidsStatus,
} from '@/lib/rapids';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { apprentice_id, status, rapids_id } = body;

    if (!apprentice_id) {
      return NextResponse.json(
        { error: 'apprentice_id is required' },
        { status: 400 }
      );
    }

    const safeStatus = normalizeRapidsStatus(status);

    const supabase = createAdminClient();

    // Get current status to validate transition
    const { data: current } = await supabase
      .from('rapids_tracking')
      .select('status')
      .eq('apprentice_id', apprentice_id)
      .single();

    // If record exists, validate transition
    if (current && current.status) {
      const canTransition = canTransitionRapidsStatus(
        current.status as RapidsStatus,
        safeStatus
      );
      if (!canTransition) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${current.status} to ${safeStatus}`,
          },
          { status: 400 }
        );
      }
    }

    // Update or insert
    const updateData: any = {
      apprentice_id,
      status: safeStatus,
    };

    if (rapids_id) {
      updateData.rapids_id = rapids_id;
    }

    if (safeStatus === 'registered' && !current) {
      updateData.registration_date = new Date().toISOString().split('T')[0];
    }

    if (safeStatus === 'completed') {
      updateData.completion_date = new Date().toISOString().split('T')[0];
    }

    const { data, error }: any = await supabase
      .from('rapids_tracking')
      .upsert(updateData, { onConflict: 'apprentice_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true, rapids: data });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
