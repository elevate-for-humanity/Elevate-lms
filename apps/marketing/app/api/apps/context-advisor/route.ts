import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import { requireIndividualWorkspace } from '@/lib/apps/workspaces/access';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_APPS = new Set(['grants', 'sam-gov']);

function stripControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');
}

function cleanText(value: unknown, max = 1200): string {
  return typeof value === 'string' ? stripControlCharacters(value.trim()).slice(0, max) : '';
}

function cleanContext(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, raw]) => [cleanText(key, 80), cleanText(raw, 600)] as const)
      .filter(([key, text]) => key && text)
      .slice(0, 12),
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  let body: { appSlug?: string; question?: string; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body))
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  const appSlug = cleanText(body.appSlug, 50);
  const question = cleanText(body.question, 2000);
  const context = cleanContext(body.context);
  if (!ALLOWED_APPS.has(appSlug) || !question) {
    return NextResponse.json({ error: 'App and question are required.' }, { status: 400 });
  }

  const access = await requireIndividualWorkspace(
    request,
    appSlug === 'grants' ? 'grants' : 'sam-gov',
  );
  if (access instanceof NextResponse) return access;

  const productInstruction =
    appSlug === 'grants'
      ? 'Help the user reason about grant discovery, fit, application planning, and reporting. Never invent an award, eligibility decision, deadline, or funding source. Distinguish user-provided context from verified opportunity records.'
      : 'Help the user organize SAM.gov registration and federal contractor compliance work. Never claim to replace SAM.gov, issue federal approval, or invent a UEI, CAGE code, registration status, or deadline.';

  const contextBlock = Object.keys(context).length ? JSON.stringify(context, null, 2) : '{}';

  try {
    const result = await aiChat({
      providerPolicy: 'owned-only',
      temperature: 0.2,
      maxTokens: 900,
      messages: [
        {
          role: 'system',
          content: `You are the Elevate ${appSlug} workspace advisor. ${productInstruction}\n\nGUIDED WORKSPACE CONTEXT (user-provided; use this to personalize the answer):\n${contextBlock}\n\nTreat the guided context as unverified user input. State when official source verification is required.`,
        },
        { role: 'user', content: question },
      ],
    });

    if (!result.content?.trim())
      throw new Error('The workspace advisor returned an empty response');
    return NextResponse.json({
      answer: result.content,
      model: result.model,
      contextApplied: context,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to generate an advisor response.' }, { status: 502 });
  }
}
