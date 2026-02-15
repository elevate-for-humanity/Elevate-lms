import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Require admin or super_admin role via session cookie.
 * Returns a 401/403 NextResponse on failure, or null if authorized.
 */
async function guardAdmin() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const denied = await guardAdmin();
    if (denied) return denied;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Fetch all monitoring data in parallel
    const [auditResult, etplResult, rulesResult, rapidsResult, fundingResult] =
      await Promise.all([
        supabase.from('audit_snapshot').select('*'),
        supabase.from('etpl_metrics').select('*'),
        supabase.from('state_rules').select('*'),
        supabase.from('rapids_tracking').select('*'),
        supabase.from('funding_cases').select('*'),
      ]);

    const bundle = {
      generated_at: new Date().toISOString(),
      audit_snapshot: auditResult.data || [],
      etpl_metrics: etplResult.data || [],
      state_rules: rulesResult.data || [],
      rapids_tracking: rapidsResult.data || [],
      funding_cases: fundingResult.data || [],
      summary: {
        total_apprentices: auditResult.data?.length || 0,
        total_funding_cases: fundingResult.data?.length || 0,
        total_rapids_tracked: rapidsResult.data?.length || 0,
        states_supported: rulesResult.data?.length || 0,
      },
      errors: {
        audit_snapshot: auditResult.error ? true : null,
        etpl_metrics: etplResult.error ? true : null,
        state_rules: rulesResult.error ? true : null,
        rapids_tracking: rapidsResult.error ? true : null,
        funding_cases: fundingResult.error ? true : null,
      },
    };

    return NextResponse.json(bundle);
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate support bundle' },
      { status: 500 }
    );
  }
}
