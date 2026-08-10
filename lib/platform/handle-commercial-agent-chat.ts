import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { executeAiTask } from '@/lib/ai/execute-ai-task';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { getCommercialAgent } from '@/lib/platform/commercial-ai-agents';
import type { ChatMessage } from '@/lib/ai/types';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';

export async function handleCommercialAgentChat(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const agent = getCommercialAgent(typeof body.agent === 'string' ? body.agent.toLowerCase() : '');
  if (!agent) return NextResponse.json({ error: 'Unknown AI assistant' }, { status: 400 });

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 6000) : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  let access = await requireFeatureForAuth(request, agent.feature);
  let trialCredits: { charged: number; balance: number | null } | null = null;

  if (access instanceof NextResponse) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        {
          error: `${agent.name} is an upgrade for this organization.`,
          feature: agent.feature,
          upgradeUrl: `https://www.elevateforhumanity.org/store?search=${encodeURIComponent(agent.name)}`,
        },
        { status: 403 },
      );
    }

    const credit = await consumeWebsiteBuilderCredits(supabase, user.id, 'assistant_chat');
    if (!credit.allowed || !credit.isTrial) {
      return NextResponse.json(
        {
          error: credit.error || `${agent.name} is an upgrade for this organization.`,
          feature: agent.feature,
          creditsRemaining: credit.balance,
          upgradeUrl: credit.upgradeUrl || `https://www.elevateforhumanity.org/store?search=${encodeURIComponent(agent.name)}`,
        },
        { status: credit.isTrial ? 402 : 403 },
      );
    }

    trialCredits = { charged: credit.charged, balance: credit.balance };
    access = { userId: user.id, tenantId: 'website-builder-trial' };
  }

  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history
        .filter((item: any) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
        .slice(-20)
        .map((item: any) => ({ role: item.role, content: item.content.slice(0, 6000) }))
    : [];

  const organizationContext = typeof body.organizationContext === 'string'
    ? body.organizationContext.trim().slice(0, 8000)
    : '';

  const prompt = `${agent.role}\n\n${organizationContext ? `Organization context:\n${organizationContext}\n\n` : ''}User request:\n${message}`;

  try {
    const result = await executeAiTask({
      task: agent.task,
      prompt,
      context: {
        history,
        userId: access.userId,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 160) : undefined,
        instructorName: agent.name,
        instructorPersona: agent.role,
      },
      maxTokens: 1800,
      temperature: 0.35,
    });

    logger.info('[commercial-ai] assistant response', {
      agent: agent.id,
      userId: access.userId,
      tenantId: access.tenantId,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      trialCreditsCharged: trialCredits?.charged ?? 0,
      trialCreditsRemaining: trialCredits?.balance ?? null,
    });

    return NextResponse.json({
      agent: agent.id,
      name: agent.name,
      response: result.content,
      provider: result.provider,
      tokensUsed: result.tokensUsed ?? null,
      creditsCharged: trialCredits?.charged ?? 0,
      creditsRemaining: trialCredits?.balance ?? null,
    });
  } catch (error) {
    logger.error('[commercial-ai] assistant failed', error instanceof Error ? error : new Error(String(error)), { agent: agent.id });
    return NextResponse.json({
      error: `${agent.name} is temporarily unavailable`,
      creditsCharged: trialCredits?.charged ?? 0,
      creditsRemaining: trialCredits?.balance ?? null,
    }, { status: 503 });
  }
}
