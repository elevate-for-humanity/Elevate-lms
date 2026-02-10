import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/authGuards';

export async function POST(req: Request) {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const {
      apprentice_id,
      employer_id,
      wage_rate,
      reimbursement_rate,
      hours_worked,
      status,
    } = body;

    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('ojt_reimbursements')
      .insert([
        {
          apprentice_id,
          employer_id,
          wage_rate,
          reimbursement_rate: reimbursement_rate || 0.5, // Default 50%
          hours_worked,
          status: status || 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ojt: data });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('ojt_reimbursements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    return NextResponse.json({ ojt_reimbursements: data });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, status } = body;

    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('ojt_reimbursements')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ojt: data });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
