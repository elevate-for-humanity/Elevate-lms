import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if student has Milady enrollment
    const { data: miladyEnrollment } = await supabase
      .from('partner_lms_enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('provider_type', 'milady')
      .maybeSingle();

    if (!miladyEnrollment) {
      return NextResponse.json(
        { error: 'No Milady enrollment found' },
        { status: 404 }
      );
    }

    // Update onboarding record
    const { error } = await supabase
      .from('student_onboarding')
      .update({ milady_orientation_completed: true })
      .eq('student_id', userId);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to mark orientation complete' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/student/mark-milady-orientation', _POST);
