// Student: check completion gate status
// GET /api/barber/completion-status

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_PROGRAM_ID = process.env.BARBER_PROGRAM_ID ?? '';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  try {
    // Read from the completion gate view
    const { data: status, error } = await supabase
      .from('barber_completion_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', BARBER_PROGRAM_ID)
      .maybeSingle();

    if (error || !status) {
      // No ledger row yet — student hasn't started
      return NextResponse.json({
        is_complete: false,
        total_hours: 0,
        gate_total_hours: false,
        gate_module_hours: false,
        gate_practicals: false,
        gate_signoffs: false,
        gate_final_signoff: false,
        gate_checkpoints: false,
        gate_final_exam: false,
        practicals_met: 0,
        modules_signed_off: 0,
        checkpoints_passed: 0,
      });
    }

    return NextResponse.json(status);
  } catch (err) {
    return safeInternalError(err, 'Failed to load completion status');
  }
}
