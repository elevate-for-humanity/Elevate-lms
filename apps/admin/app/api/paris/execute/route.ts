import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { runAdminAgentCommand } from '@/lib/ai/agent-runtime';
import type { ElevateAgent } from '@/lib/ai/tools/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGENT_MAP: Record<string, ElevateAgent> = {
  paris: 'PARIS',
  pars: 'PARIS',
  'course-orchestrator': 'PARIS',
  'instructional-designer': 'PARIS',
  'qa-designer': 'ZORA',
  'marketing-content': 'PARIS',
  'marketing-social': 'PARIS',
  'marketing-video': 'PARIS',
  'workforce-agent': 'ZORA',
  'admissions-agent': 'PARIS',
  'media-designer': 'PARIS',
  ellie: 'ELLIE',
  lizzy: 'LIZZY',
  zora: 'ZORA',
};

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const command = typeof body.command === 'string' ? body.command.trim() : '';
  if (!command) {
    return NextResponse.json({ success: false, message: 'command is required' }, { status: 400 });
  }
  if (command.length > 8000) {
    return NextResponse.json({ success: false, message: 'command is too long' }, { status: 400 });
  }

  const agentType = typeof body.agentType === 'string' ? body.agentType.toLowerCase() : 'paris';
  const agent = AGENT_MAP[agentType] ?? 'PARIS';

  const db: any = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('tenant_id,organization_id')
    .eq('id', auth.id)
    .maybeSingle();

  const context = body.context && typeof body.context === 'object' && !Array.isArray(body.context)
    ? body.context as Record<string, unknown>
    : {};

  const result = await runAdminAgentCommand({
    agent,
    command,
    actor: {
      id: auth.id,
      roles: auth.effectiveRoles,
      tenantId: profile?.tenant_id ?? null,
    },
    context: {
      ...context,
      organizationId: profile?.organization_id ?? null,
    },
  });

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
