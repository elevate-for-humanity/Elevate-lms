/**
 * /api/ai-chat - PARIS AI Chat API for Marketing Site
 *
 * Public-facing responses must not create funding, placement, licensing,
 * apprenticeship, or cost guarantees that are not supported by the canonical
 * program and compliance records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const verifiedFundingList = VERIFIED_WORKFORCE_FUNDED_PROGRAMS
  .map((program) => `${program.title}: ${program.description}`)
  .join('\n- ');

const PARIS_SYSTEM_PROMPT = `You are PARIS, the public AI assistant for ${PLATFORM_DEFAULTS.orgName}.

COMPLIANCE RULES — THESE OVERRIDE MARKETING LANGUAGE:
- Never promise or imply that training is free, $0, fully funded, guaranteed, or covered at a specific percentage.
- Never say a participant qualifies for WIOA, Workforce Ready Grant, Job Ready Indy, SNAP E&T, Vocational Rehabilitation, employer reimbursement, or any other public funding source. Eligibility and authorization are determined by the responsible agency and the exact program record.
- Never call a program WIOA-, ETPL-, WRG-, or RAPIDS-approved unless it appears in the verified canonical program information supplied below.
- Never promise employment, job placement, wages, salary, tax credits, licensing, completion time, employer placement, host-site placement, exam passage, or credential attainment.
- When a user asks about funding, explain that application screening is not an award and written authorization from the responsible funding source is required before enrollment is treated as funded.
- When uncertain, direct the user to the canonical program page, /funding, /apply, or a human advisor rather than guessing.

VERIFIED PUBLIC WORKFORCE-FUNDING PROGRAM RECORDS:
- ${verifiedFundingList || 'No program-level public funding records are currently configured.'}

REGISTERED APPRENTICESHIP:
- Barber Apprenticeship is the federally registered beauty occupation currently identified by Elevate's canonical public RAPIDS configuration.
- Do not label cosmetology, esthetics, nail technology, or other occupations as federally registered unless the canonical registry changes.

CONTACT:
- Phone: ${PLATFORM_DEFAULTS.supportPhone}
- Website: https://${PLATFORM_DEFAULTS.canonicalDomain}

RESPONSE STYLE:
- Answer the question directly and concisely.
- Distinguish verified facts from eligibility screening.
- Provide the next official step.
- Keep responses under 180 words.`;

function getSmartFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('apply') || lower.includes('application')) {
    return `You can start at https://www.elevateforhumanity.org/apply. The application collects the program and payment/funding pathway you want reviewed. Submitting an application does not guarantee enrollment or public funding. If you are seeking third-party funding, Elevate should treat the enrollment as funded only after the responsible agency provides written authorization.`;
  }

  if (
    lower.includes('free') ||
    lower.includes('cost') ||
    lower.includes('price') ||
    lower.includes('funding') ||
    lower.includes('wioa') ||
    lower.includes('wrg')
  ) {
    const titles = VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => program.title).join(', ');
    return `Funding is program- and participant-specific; it is not guaranteed by the website or application. Elevate's current public funding registry contains: ${titles || 'no published program-level funding records'}. Your eligibility, approved amount, covered costs, and authorization must be confirmed by the responsible workforce or funding agency. Review https://www.elevateforhumanity.org/funding and then submit the exact program through https://www.elevateforhumanity.org/apply.`;
  }

  if (lower.includes('barber') || lower.includes('apprentice')) {
    return `Elevate's Barber Apprenticeship is the beauty occupation currently identified in the canonical public Registered Apprenticeship configuration. The program page contains the current OJL/RTI requirements, tuition, application steps, and funding disclosure. Host-shop placement and third-party funding require separate confirmation and are not guaranteed. Review https://www.elevateforhumanity.org/programs/barber-apprenticeship.`;
  }

  if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
    return `Elevate publishes career-training pathways across healthcare, skilled trades, beauty/personal services, technology, and business. Program requirements, credentials, tuition, duration, delivery method, and funding status can differ, so use the individual program record rather than a general category description. Start at https://www.elevateforhumanity.org/programs.`;
  }

  if (lower.includes('phone') || lower.includes('call') || lower.includes('contact')) {
    return `Contact Elevate at ${PLATFORM_DEFAULTS.supportPhone} or use https://www.elevateforhumanity.org/contact. For funding questions, ask about the exact program and the funding source so the applicable authorization can be verified.`;
  }

  return `I can help you find the correct program, application, funding guidance, or apprenticeship information. I won't guess about eligibility, funding awards, placement, wages, licensing, or program approvals. Start with https://www.elevateforhumanity.org/programs, or tell me the exact program you are asking about.`;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages || [];
    const userMessage = messages.length > 0 ? messages[messages.length - 1].content : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey) {
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
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            reply: data.content?.[0]?.text || getSmartFallback(userMessage),
          });
        }
      } catch (apiError) {
        console.error('Anthropic API error:', apiError);
      }
    }

    return NextResponse.json({ reply: getSmartFallback(userMessage) });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      reply: `I cannot verify that information right now. Please use https://www.elevateforhumanity.org/programs or contact Elevate at ${PLATFORM_DEFAULTS.supportPhone} for the exact program record.`,
    });
  }
}
