import { PARIS_SYSTEM_IDENTITY } from '@/lib/ai/paris-identity';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { executeAiTask } from '@/lib/ai/execute-ai-task';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { getCommercialAgent } from '@/lib/platform/commercial-ai-agents';
import type { ChatMessage } from '@/lib/ai/types';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { reserveCommercialAiReply, CommercialAiCreditsError } from '@/lib/platform/commercial-ai-credits';
import { COMMERCIAL_AI_INPUT_LIMITS } from '@/lib/platform/commercial-ai-usage-policy';
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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'JSON object required' }, { status: 400 });
  }

  // Capability selection changes task context, never subscription or role grants.
  const unified = body.unified === true;
  const requestedText = typeof body.message === 'string' ? body.message : '';
  const capability = /compliance|audit|wioa|credential/i.test(requestedText) ? 'zora'
    : /lesson|learn|course|study|onboarding/i.test(requestedText) ? 'ellie'
    : /operation|workflow|document|queue|admin/i.test(requestedText) ? 'lizzy' : 'paris';
  const agent = getCommercialAgent(unified ? capability : typeof body.agent === 'string' ? body.agent.toLowerCase() : '');
  if (!agent) return NextResponse.json({ error: 'Unknown AI assistant' }, { status: 400 });

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, COMMERCIAL_AI_INPUT_LIMITS.messageCharacters) : '';
  if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

  let access = await requireFeatureForAuth(request, agent.feature);
  let usageCredits: { charged: number; balance: number | null } | null = null;

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

    // Check trial eligibility before debiting. Paid Website Builder access does
    // not itself grant the separately sold organization assistant add-on.
    const builderAccess = await getWebsiteBuilderAccess(user.id, supabase);
    if (!builderAccess.allowed || builderAccess.status !== 'trial') return access;

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

    usageCredits = { charged: credit.charged, balance: credit.balance };
    access = { userId: user.id, tenantId: 'website-builder-trial' };
  } else {
    try {
      usageCredits = await reserveCommercialAiReply({
        tenantId: access.tenantId, userId: access.userId, agent: agent.id,
        idempotencyKey: request.headers.get('idempotency-key'),
      });
    } catch (error) {
      const known = error instanceof CommercialAiCreditsError;
      return NextResponse.json({
        error: known ? error.message : 'Usage verification is temporarily unavailable',
        code: known ? error.code : 'USAGE_UNAVAILABLE',
        upgradeUrl: '/store/plans',
      }, { status: known ? error.status : 503 });
    }
  }

  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history
        .filter((item: any) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
        .slice(-COMMERCIAL_AI_INPUT_LIMITS.historyMessages)
        .map((item: any) => ({ role: item.role, content: item.content.slice(0, COMMERCIAL_AI_INPUT_LIMITS.historyMessageCharacters) }))
    : [];

  const organizationContext = typeof body.organizationContext === 'string'
    ? body.organizationContext.trim().slice(0, COMMERCIAL_AI_INPUT_LIMITS.contextCharacters)
    : '';

  const prompt = `${unified ? PARIS_SYSTEM_IDENTITY : agent.role}\n\n${organizationContext ? `Organization context:\n${organizationContext}\n\n` : ''}User request:\n${message}`;

  try {
    const result = await executeAiTask({
      task: agent.task,
      prompt,
      context: {
        commercialIdentity: !unified,
        skipRAG: true,
        history,
        userId: access.userId,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 160) : undefined,
        instructorName: unified ? 'PARIS' : agent.name,
        instructorPersona: unified ? PARIS_SYSTEM_IDENTITY : agent.role,
      },
      maxTokens: COMMERCIAL_AI_INPUT_LIMITS.outputTokens,
      temperature: 0.35,
    });

    logger.info('[commercial-ai] assistant response', {
      agent: agent.id,
      userId: access.userId,
      tenantId: access.tenantId,
      tokensUsed: result.tokensUsed,
      provider: result.provider,
      usageCreditsCharged: usageCredits?.charged ?? 0,
      usageCreditsRemaining: usageCredits?.balance ?? null,
    });

    return NextResponse.json({
      agent: unified ? 'paris' : agent.id,
      name: unified ? 'PARIS' : agent.name,
      response: result.content,
      provider: result.provider,
      tokensUsed: result.tokensUsed ?? null,
      creditsCharged: usageCredits?.charged ?? 0,
      creditsRemaining: usageCredits?.balance ?? null,
    });
  } catch (error) {
    logger.error('[commercial-ai] assistant failed', error instanceof Error ? error : new Error(String(error)), { agent: agent.id });
    return NextResponse.json({
      error: `${agent.name} is temporarily unavailable`,
      creditsCharged: usageCredits?.charged ?? 0,
      creditsRemaining: usageCredits?.balance ?? null,
    }, { status: 503 });
  }
}
