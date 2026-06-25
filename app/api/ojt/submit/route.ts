import { NextResponse } from 'next/server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function requireAdminAccess() {
  const { createClient: createAuthClient } = await import('@/lib/supabase/server');
  const authSupabase = await createAuthClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabase = await requireAdminClient();
  if (!supabase) {
    return {
      error: NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 }),
    };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile?.role || !['admin', 'staff'].includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase };
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;
    const auth = await requireAdminAccess();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { apprentice_id, employer_id, wage_rate, reimbursement_rate, hours_worked, status } =
      body;

    const { supabase } = auth;

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
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ojt: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAdminAccess();
    if (auth.error) return auth.error;
    const { supabase } = auth;

    const { data, error }: any = await supabase
      .from('ojt_reimbursements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ ojt_reimbursements: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PATCH(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAdminAccess();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, status } = body;

    const { supabase } = auth;

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/ojt/submit', _GET, { critical: true });
export const POST = withApiAudit('/api/ojt/submit', _POST, { critical: true });
export const PATCH = withApiAudit('/api/ojt/submit', _PATCH, { critical: true });
