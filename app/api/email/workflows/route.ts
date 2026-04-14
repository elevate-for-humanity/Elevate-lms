import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: workflows, error } = await supabase
      .from('email_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, workflows });
  } catch (error) { 
    logger.error(
      'Error fetching workflows:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await req.json();

    const { data: workflow, error } = await supabase
      .from('email_workflows')
      .insert({
        name: body.name,
        trigger_event: body.trigger,
        target_audience: body.targetAudience,
        steps: body.steps,
        status: body.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, workflow });
  } catch (error) { 
    logger.error(
      'Error creating workflow:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/email/workflows', _GET);
export const POST = withApiAudit('/api/email/workflows', _POST);
