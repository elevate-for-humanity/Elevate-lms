// Persists enrollment wizard draft state to program_enrollments.
// Called on a 2-second debounce by ComprehensiveEnrollmentWizard.
// Upserts a draft row keyed on (user_id, program_id). Only touches draft rows —
// if the enrollment has already been submitted the upsert is skipped.
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { programId, data, step } = await req.json();

    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 });
    }

    // Don't overwrite a submitted enrollment with draft data.
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .maybeSingle();

    if (existing && existing.status !== 'draft') {
      return NextResponse.json({ saved: false, reason: 'already_submitted' });
    }

    const { error } = await supabase.from('program_enrollments').upsert(
      {
        user_id: user.id,
        program_id: programId,
        status: 'draft',
        enrollment_state: 'draft',
        draft_data: data ?? {},
        wizard_step: step ?? 1,
        updated_at: new Date().toISOString(),
        // required NOT NULL columns on the table
        amount_paid_cents: 0,
        email: user.email ?? '',
      },
      { onConflict: 'user_id,program_id' }
    );

    if (error) {
      // Non-fatal — wizard continues even if auto-save fails
      logger.error('save-progress upsert error:', {
        code: error.code,
        message: error.message,
        userId: user.id,
        programId,
      });
    }

    return NextResponse.json({ saved: !error });
  } catch (error) {
    logger.error('save-progress error:', error);
    // Return 200 so the wizard doesn't surface an error to the user
    return NextResponse.json({ saved: false });
  }
}

export const POST = withApiAudit('/api/enrollment/save-progress', _POST);
