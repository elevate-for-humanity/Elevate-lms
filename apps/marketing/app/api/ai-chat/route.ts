/**
 * Canonical PARIS API.
 *
 * Every PARIS surface uses the shared AI gateway in lib/ai/ai-service. Surface
 * prompts change PARIS' job and permissions; they do not create another model
 * route or provider fallback chain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type ParisSurface = 'public' | 'learner' | 'store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParisContext {
  surface?: ParisSurface;
  courseTitle?: string | null;
  nextLessonTitle?: string | null;
  courseProgress?: number | null;
}

const verifiedFundingList = VERIFIED_WORKFORCE_FUNDED_PROGRAMS
  .map((program) => `${program.title}: ${program.description}`)
  .join('\n- ');

const COMPLIANCE_RULES = `
COMPLIANCE RULES:
- Never promise public funding, eligibility, approval, placement, wages, licensing, completion time, exam passage, or business results.
- Never invent product features, prices, discounts, plan limits, or availability.
- When a current price or exact entitlement is not in the supplied context, link the customer to /store/plans instead of guessing.
- Ask only for information needed to help the person. Never request passwords, payment-card data, government IDs, medical data, or other sensitive information.
- Clearly distinguish a recommendation from a guarantee.`;

const PUBLIC_PROMPT = `You are PARIS, the public admissions and career-navigation assistant for ${PLATFORM_DEFAULTS.orgName}.
${COMPLIANCE_RULES}

VERIFIED PUBLIC WORKFORCE-FUNDING PROGRAM RECORDS:
- ${verifiedFundingList || 'No program-level public funding records are currently configured.'}

Barber Apprenticeship is the federally registered beauty occupation currently identified by Elevate's canonical public RAPIDS configuration. Do not label another occupation registered unless the canonical registry changes.

Answer directly, distinguish verified facts from screening, and give the next official step. Use /programs, /funding, /apply, or /contact when appropriate. Keep responses under 180 words.`;

function learnerPrompt(context: ParisContext): string {
  return `You are PARIS, Elevate's learning assistant.
${COMPLIANCE_RULES}
Course: ${context.courseTitle || 'not supplied'}
Next lesson: ${context.nextLessonTitle || 'not supplied'}
Progress: ${typeof context.courseProgress === 'number' ? `${context.courseProgress}%` : 'not supplied'}

Explain concepts, coach the learner, ask useful checking questions, and guide them to the next lesson. Do not complete graded assignments, quizzes, exams, or assessments for the learner. Keep responses encouraging, practical, and under 220 words.`;
}

const STORE_PROMPT = `You are PARIS, Elevate's consultative platform advisor. You sell by diagnosing fit, explaining the platform clearly, and helping the customer take the next useful action.
${COMPLIANCE_RULES}

INTERVIEW:
- Ask one short question at a time.
- Learn the business or organization type, primary goal, current tools or pain point, team/learner size, urgency, and budget comfort only as needed.
- Use prior messages. Do not restart the interview or ask for facts the customer already gave you.
- If the customer asks a direct question, answer it before asking the next best question.

RECOMMENDATION:
- Recommend the smallest suitable base plan first, then only the add-ons relevant to the stated goal.
- Explain why each recommendation fits and which pain point it solves.
- Offer a more capable option only when the customer described a real need for it; do not pressure or manufacture urgency.
- For exact current pricing and plan entitlements, direct the customer to /store/plans.
- Offer the relevant interactive demo: /store/demo/capability/website_builder, /store/demo/capability/crm, /store/demo/capability/course_builder, /store/demo/institutional, /store/demo/employer, or /store/demos.
- End with one clear next step and, when useful, one interview question.
Keep responses conversational and under 220 words.`;

function systemPrompt(context: ParisContext): string {
  if (context.surface === 'store') return STORE_PROMPT;
  if (context.surface === 'learner') return learnerPrompt(context);
  return PUBLIC_PROMPT;
}

function fallbackReply(message: string, context: ParisContext): string {
  const lower = message.toLowerCase();

  if (context.surface === 'store') {
    if (/website|site|brand|online/.test(lower)) {
      return 'A website-focused setup is the best place to start. PARIS can walk you through the Website Builder demo, then pair it with CRM only if you also need lead capture and follow-up. Open /store/demo/capability/website_builder, or tell me whether you already have a website and what you want visitors to do.';
    }
    if (/lead|customer|crm|booking|follow.?up/.test(lower)) {
      return 'Start with the CRM demo to see leads, customer records, booking, and follow-up in one workflow: /store/demo/capability/crm. To recommend the smallest fitting plan, how many people will manage customer relationships?';
    }
    if (/course|training|learner|school|lms/.test(lower)) {
      return 'The Course Builder demo shows creation, delivery, learner progress, and certificates: /store/demo/capability/course_builder. Are you selling public courses, training employees, or operating a school or workforce program?';
    }
    if (/workforce|apprent|employer|compliance|wioa/.test(lower)) {
      return 'Your needs likely fit the institutional platform rather than a collection of separate apps. See /store/demo/institutional. About how many learners, employers, and staff members need access?';
    }
    if (/price|cost|plan|subscription/.test(lower)) {
      return 'I can help narrow the plan, and /store/plans is the source for current prices and entitlements. What are you mainly trying to accomplish: build a website, manage customers, sell training, or run a workforce program?';
    }
    return 'I’ll recommend the smallest setup that fits and explain any useful add-ons. What are you trying to accomplish first: build a website, get and manage customers, sell training, or run a workforce or apprenticeship program?';
  }

  if (context.surface === 'learner') {
    return 'I can help explain the concept and guide your next step, but I cannot complete graded work for you. Tell me the topic or the part that feels unclear.';
  }

  if (/apply|application/.test(lower)) {
    return 'Start at /apply. Submitting an application does not guarantee enrollment or funding; written authorization from the responsible funding source is required before enrollment is treated as funded.';
  }
  if (/fund|free|wioa|wrg|cost|price/.test(lower)) {
    return 'Funding is program- and participant-specific and is not guaranteed. Review /funding, then use /apply for the exact program so the responsible agency can verify eligibility and authorization.';
  }
  if (/barber|apprent/.test(lower)) {
    return 'Review the current Barber Apprenticeship record at /programs/barber-apprenticeship. Host-shop placement and third-party funding require separate confirmation and are not guaranteed.';
  }
  return 'I can help you find the correct program, application, funding guidance, or apprenticeship information. Tell me the exact program or goal, or start at /programs.';
}

function validMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Message =>
      Boolean(item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string'),
    )
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 4000) }))
    .filter((item) => item.content.length > 0)
    .slice(-20);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const context: ParisContext = body.context && typeof body.context === 'object' ? body.context : {};
    const messages = validMessages(body.messages);
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;

    if (!lastUserMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (!isAIAvailable()) {
      return NextResponse.json({ reply: fallbackReply(lastUserMessage, context), mode: 'guided' });
    }

    try {
      const result = await aiChat({
        messages: [{ role: 'system', content: systemPrompt(context) }, ...messages],
        temperature: context.surface === 'store' ? 0.45 : 0.25,
        maxTokens: 700,
      });

      return NextResponse.json({ reply: result.content, provider: result.provider });
    } catch (error) {
      console.error('Canonical PARIS gateway error:', error);
      return NextResponse.json({ reply: fallbackReply(lastUserMessage, context), mode: 'guided' });
    }
  } catch (error) {
    console.error('PARIS request error:', error);
    return NextResponse.json({
      reply: `I cannot verify that information right now. Please use /programs or contact Elevate at ${PLATFORM_DEFAULTS.supportPhone}.`,
    });
  }
}
