import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update onboarding record
    const { error } = await supabase
      .from('student_onboarding')
      .update({ handbook_reviewed: true })
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
      { err: toErrorMessage(err) || 'Failed to acknowledge handbook' },
      { status: 500 }
    );
  }
}
