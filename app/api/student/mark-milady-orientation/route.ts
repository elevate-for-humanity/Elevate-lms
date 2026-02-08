import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
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
