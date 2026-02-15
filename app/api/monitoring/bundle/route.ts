import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = getSupabaseAdmin();

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
        audit_snapshot: auditResult.error?.message || null,
        etpl_metrics: etplResult.error?.message || null,
        state_rules: rulesResult.error?.message || null,
        rapids_tracking: rapidsResult.error?.message || null,
        funding_cases: fundingResult.error?.message || null,
      }
    };

    return NextResponse.json(bundle);
  } catch (err: any) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
