export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/cash-advances/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();
    const { id } = await params;

    const { data, error }: any = await supabase
      .from('cash_advance_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

async function _PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();
    const { id } = await params;
    const body = await parseBody<Record<string, any>>(request);

    const { data, error }: any = await supabase
      .from('cash_advance_applications')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) { 
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/cash-advances/applications/[id]', _GET);
export const PATCH = withApiAudit('/api/cash-advances/applications/[id]', _PATCH);
