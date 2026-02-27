import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(_request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data, error }: any = await db
      .from('benefits_plans')
      .select('*')
      .eq('is_active', true)
      .order('plan_name');

    if (error) throw error;

    return NextResponse.json({ plans: data });
  } catch (error) { 
    logger.error(
      'Error fetching benefits plans:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to fetch benefits plans' },
      { status: 500 }
    );
  }
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const body = await parseBody<Record<string, any>>(request);

    const { plan_name, plan_type, carrier_name, plan_code, description } = body;

    if (!plan_name || !plan_type) {
      return NextResponse.json(
        { error: 'plan_name and plan_type are required' },
        { status: 400 }
      );
    }

    const { data, error }: any = await db
      .from('benefits_plans')
      .insert({
        plan_name,
        plan_type,
        carrier_name,
        plan_code,
        description,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (error) { 
    logger.error(
      'Error creating benefits plan:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create benefits plan' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/hr/benefits-plans', _GET);
export const POST = withApiAudit('/api/hr/benefits-plans', _POST);
