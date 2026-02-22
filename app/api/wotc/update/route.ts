
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { employer_id, apprentice_id, hire_date, submitted, eligible } = body;

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { data, error }: any = await db
      .from('wotc_tracking')
      .upsert(
        {
          employer_id,
          apprentice_id,
          hire_date,
          submitted,
          eligible,
        },
        { onConflict: 'apprentice_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, wotc: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await db
      .from('wotc_tracking')
      .select('*')
      .order('hire_date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    // Calculate urgency for each record
    const enrichedData = data?.map((item: any) => {
      const deadline = new Date(record.hire_date);
      deadline.setDate(deadline.getDate() + 28);
      const daysRemaining = Math.ceil(
        (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...record,
        deadline: deadline.toISOString().split('T')[0],
        days_remaining: daysRemaining,
        is_urgent: daysRemaining <= 5 && daysRemaining >= 0,
        is_overdue: daysRemaining < 0,
      };
    });

    return NextResponse.json({ wotc_tracking: enrichedData });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
