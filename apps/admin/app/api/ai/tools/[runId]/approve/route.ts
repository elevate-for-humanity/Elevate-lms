import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { approveAndExecuteAITool } from '@/lib/ai/tools/executor';
import type { ElevateAgent } from '@/lib/ai/tools/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { runId } = await params;
  const body = await request.json().catch(() => ({}));
  const agent = (typeof body.agent === 'string' ? body.agent.toUpperCase() : 'PARIS') as ElevateAgent;
  if (!['PARIS', 'ELLIE', 'LIZZY', 'ZORA', 'ROUTER'].includes(agent)) {
    return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
  }

  const db: any = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('tenant_id')
    .eq('id', auth.id)
    .maybeSingle();

  const result = await approveAndExecuteAITool({
    runId,
    agent,
    approver: {
      id: auth.id,
      roles: auth.effectiveRoles,
      tenantId: profile?.tenant_id ?? null,
    },
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
