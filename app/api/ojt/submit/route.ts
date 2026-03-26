import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;
    // Auth: require authenticated user
    const { createClient: createAuthClient } = await import('@/lib/supabase/server');
    const authSupabase = await createAuthClient();
    const { data: { session: authSession } } = await authSupabase.auth.getSession();
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ojt: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('ojt_reimbursements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ ojt_reimbursements: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _PATCH(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

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
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ojt: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/ojt/submit', _GET, { critical: true });
export const POST = withApiAudit('/api/ojt/submit', _POST, { critical: true });
export const PATCH = withApiAudit('/api/ojt/submit', _PATCH, { critical: true });
