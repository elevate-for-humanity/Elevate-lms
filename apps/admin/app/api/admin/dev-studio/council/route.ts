import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { getAiCharterContext } from '@/lib/devstudio/platform-control-plane';
import { getRAGContext } from '@/lib/platform/rag';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  getElevateCouncilAvailability,
  runElevateCouncil,
} from '@/lib/ai/elevate-council';
import type { ChatMessage } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

type RequestMessage = {
  role?: unknown;
  content?: unknown;
};

function normalizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item: RequestMessage) => {
    if (!item || typeof item !== 'object') return [];
    if (!['user', 'assistant', 'system'].includes(String(item.role))) return [];
    if (typeof item.content !== 'string') return [];

    const content = item.content.trim();
    if (!content) return [];

    return [
      {
        role: String(item.role) as ChatMessage['role'],
        content: content.slice(0, 30_000),
      },
    ];
  });
}

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  try {
    await hydrateProcessEnv();

    const body = await req.json().catch(() => null);
    const messages = normalizeMessages(body?.messages);
    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'A non-empty messages array is required.' },
        { status: 400 },
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user')?.content;
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'At least one user message is required.' },
        { status: 400 },
      );
    }

    const ragContext = await getRAGContext(lastUserMessage);
    const systemPrompt = [
      'You are the Elevate AI Council for production engineering and workforce-platform operations.',
      'Use the supplied platform charter and retrieved context as evidence. Do not invent repository state, test results, deployments, approvals, credentials, or live observations.',
      'When evidence is incomplete, identify the exact missing verification rather than guessing.',
      '',
      '## Platform charter',
      getAiCharterContext(),
      '',
      ragContext ? `## Retrieved platform context\n${ragContext}` : '',
      typeof body?.context === 'string'
        ? `## Request context\n${body.context.slice(0, 20_000)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await runElevateCouncil({
      messages,
      systemPrompt,
      maxTokens:
        typeof body?.maxTokens === 'number'
          ? Math.min(Math.max(body.maxTokens, 512), 4096)
          : undefined,
      temperature:
        typeof body?.temperature === 'number'
          ? Math.min(Math.max(body.temperature, 0), 1)
          : undefined,
    });

    return NextResponse.json({
      message: result.content,
      provider: result.provider,
      model: result.model,
      contributors: result.contributors,
      degraded: result.degraded,
      availability: getElevateCouncilAvailability(),
      contributionCount: result.contributions.length,
    });
  } catch (error) {
    logger.error('[devstudio/council] request failed', error);
    return NextResponse.json(
      {
        error: 'Elevate AI Council could not complete this request.',
        availability: getElevateCouncilAvailability(),
      },
      { status: 503 },
    );
  }
}

export const POST = withApiAudit('/api/admin/dev-studio/council', _POST);
