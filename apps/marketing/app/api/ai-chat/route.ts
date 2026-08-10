/**
 * /api/ai-chat — public admissions chat for the Marketing site.
 *
 * AUTH: Intentionally public. This endpoint is used before account creation by
 * the public LiveChatWidget. It is IP rate-limited and must not perform
 * privileged operations or expose internal data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_MESSAGE_LENGTH = 2000;

const PARIS_SYSTEM_PROMPT = `You are PARIS, the public admissions assistant for ${PLATFORM_DEFAULTS.orgName}.

Your job is to help visitors navigate the public website. Use cautious, evidence-based language.

Rules you must follow:
- Never promise that training is free, fully funded, guaranteed, approved, licensed, accredited, or job-placing unless the exact program page supplied to the visitor says so.
- Funding is participant- and program-specific. WorkOne or the responsible funding agency determines eligibility, available funds, covered costs, and authorization.
- Do not invent pass rates, placement rates, wages, employer counts, approvals, start dates, deadlines, or success stories.
- Do not tell a visitor that every program has the same credential, funding source, delivery mode, or approval.
- For program details, direct visitors to https://www.elevateforhumanity.org/programs.
- For WIOA information, direct visitors to https://www.elevateforhumanity.org/funding/wioa.
- For apprenticeship status, direct visitors to https://www.elevateforhumanity.org/apprenticeships and https://www.elevateforhumanity.org/approvals.
- For an application, direct visitors to https://www.elevateforhumanity.org/apply/student.
- Keep answers concise, professional, and under 150 words.`;

function fallbackReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('apply') || lower.includes('application')) {
    return 'You can start the student application at https://www.elevateforhumanity.org/apply/student. Review the individual program page first so you have the current admission, schedule, tuition, credential, and document requirements.';
  }

  if (lower.includes('free') || lower.includes('cost') || lower.includes('price') || lower.includes('funding') || lower.includes('wioa')) {
    return 'Funding depends on the participant, the exact program, available funds, and the responsible agency’s written authorization. A website funding label is not a funding guarantee. Review https://www.elevateforhumanity.org/funding and https://www.elevateforhumanity.org/funding/wioa, then confirm the approved amount with WorkOne or your funding agency.';
  }

  if (lower.includes('barber') || lower.includes('apprentice')) {
    return 'The current registered-apprenticeship information is published at https://www.elevateforhumanity.org/apprenticeships and the Barber program record is at https://www.elevateforhumanity.org/programs/barber-apprenticeship. Use those pages for current hours, tuition, host-shop, funding, and licensing information.';
  }

  if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
    return 'The current program directory is https://www.elevateforhumanity.org/programs. Open the specific program before relying on tuition, duration, funding, credential, licensing, or schedule information because those details vary by program.';
  }

  if (lower.includes('contact') || lower.includes('phone') || lower.includes('call')) {
    return `Admissions can be reached at ${PLATFORM_DEFAULTS.supportPhone}. You can also use https://www.elevateforhumanity.org/contact.`;
  }

  return 'I can help you find current program, funding, apprenticeship, application, testing, or contact information. For the most accurate details, start with https://www.elevateforhumanity.org/programs and open the exact program you are considering.';
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messages = (body as { messages?: Array<{ role?: string; content?: unknown }> })?.messages;
  const rawMessage = Array.isArray(messages) && messages.length
    ? messages[messages.length - 1]?.content
    : '';
  const userMessage = typeof rawMessage === 'string'
    ? rawMessage.trim().slice(0, MAX_MESSAGE_LENGTH)
    : '';

  if (!userMessage) {
    return NextResponse.json({ error: 'No message provided' }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ reply: fallbackReply(userMessage), source: 'verified-fallback' });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: PARIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ reply: fallbackReply(userMessage), source: 'verified-fallback' });
    }

    const data = await response.json();
    const reply = typeof data?.content?.[0]?.text === 'string'
      ? data.content[0].text.trim()
      : '';

    if (!reply) {
      return NextResponse.json({ reply: fallbackReply(userMessage), source: 'verified-fallback' });
    }

    return NextResponse.json({ reply, source: 'ai' });
  } catch {
    return NextResponse.json({ reply: fallbackReply(userMessage), source: 'verified-fallback' });
  }
}
