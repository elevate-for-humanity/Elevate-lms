
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  normalizeRapidsStatus,
  canTransitionRapidsStatus,
  type RapidsStatus,
} from '@/lib/rapids';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
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

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

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

    const { data, error } = await auditedMutation({
      table: 'rapids_tracking',
      operation: 'upsert',
      rowData: updateData,
      conflictOn: ['apprentice_id'],
      audit: {
        action: 'api:post:/api/rapids/safe-update',
        targetType: 'rapids_tracking',
        targetId: apprentice_id,
        metadata: { status: safeStatus, previous_status: current?.status },
      },
    });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, rapids: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/rapids/safe-update', _POST, { critical: true });
