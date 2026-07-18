import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// PARIS AI System Prompt
const PARIS_SYSTEM_PROMPT = `You are PARIS, the AI assistant for ${PLATFORM_DEFAULTS.orgName}.

**About Us:**
- Workforce development nonprofit in Indianapolis, Indiana
- DOL Registered Apprenticeship Sponsor
- Training is FREE for eligible participants through WIOA, Workforce Ready Grant, and Job Ready Indy

**Our Programs:**
- Healthcare: CNA, Phlebotomy, Medical Assistant
- Skilled Trades: HVAC, CDL Truck Driving, Electrical, Plumbing
- Professional: Barbering, Cosmetology, Esthetics, Nail Tech
- Technology: IT Fundamentals, Cybersecurity

**Funding Options:**
- WIOA: 100% free for low-income adults
- Workforce Ready Grant: Indiana residents
- Job Ready Indy: Justice-involved individuals
- Payment plans available

**Contact:**
- Phone: ${PLATFORM_DEFAULTS.supportPhone}
- Email: info@${PLATFORM_DEFAULTS.canonicalDomain}
- Website: ${PLATFORM_DEFAULTS.canonicalDomain}

**Response Guidelines:**
- Be warm, encouraging, and helpful
- Answer the specific question directly
- Use bullet points for lists
- Always provide a clear next step
- Keep responses under 150 words
- End with an action or helpful resource`;

function getSmartFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
    return `We offer funded training in:

**Healthcare:** CNA, Phlebotomy, Medical Assistant
**Skilled Trades:** HVAC, CDL, Electrical, Plumbing
**Professional:** Barbering, Cosmetology, Esthetics

Visit ${PLATFORM_DEFAULTS.canonicalDomain}/programs or call ${PLATFORM_DEFAULTS.supportPhone}!`;
  }

  if (lower.includes('apply') || lower.includes('start') || lower.includes('enroll')) {
    return `Ready to start your career?

1. Visit ${PLATFORM_DEFAULTS.canonicalDomain}/apply (5 min)
2. We'll check your eligibility for FREE training
3. Start your new career!

Call ${PLATFORM_DEFAULTS.supportPhone} for instant help!`;
  }

  if (lower.includes('free') || lower.includes('cost') || lower.includes('pay') || lower.includes('fund')) {
    return `Great news! Training may be FREE through:

• **WIOA** - For low-income adults
• **Workforce Ready Grant** - Indiana residents
• **Job Ready Indy** - Justice-involved individuals

Check eligibility: ${PLATFORM_DEFAULTS.canonicalDomain}/wioa-eligibility or call ${PLATFORM_DEFAULTS.supportPhone}!`;
  }

  if (lower.includes('contact') || lower.includes('call') || lower.includes('human')) {
    return `You can reach us at:

📞 ${PLATFORM_DEFAULTS.supportPhone}
📧 info@${PLATFORM_DEFAULTS.canonicalDomain}
🌐 ${PLATFORM_DEFAULTS.canonicalDomain}

We're here to help you start your career journey!`;
  }

  return `Thanks for reaching out! I can help you with:

• Finding the right program
• Checking funding eligibility
• Application questions

What would you like to know more about?`;
}

async function callAnthropic(messages: any[]): Promise<{ reply: string; provider: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: PARIS_SYSTEM_PROMPT,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { reply: data.content?.[0]?.text || '', provider: 'anthropic' };
  } catch (e) {
    logger.warn('[ai-chat] Anthropic call failed', e);
    return null;
  }
}

async function callOpenAI(messages: any[]): Promise<{ reply: string; provider: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: PARIS_SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { reply: data.choices?.[0]?.message?.content || '', provider: 'openai' };
  } catch (e) {
    logger.warn('[ai-chat] OpenAI call failed', e);
    return null;
  }
}

async function _POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const messages = body.messages.map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.content || ''),
    }));

    // Try PARIS AI (Anthropic) first
    const anthropicResult = await callAnthropic(messages);
    if (anthropicResult) {
      return NextResponse.json({ reply: anthropicResult.reply, provider: anthropicResult.provider });
    }

    // Fall back to OpenAI
    const openaiResult = await callOpenAI(messages);
    if (openaiResult) {
      return NextResponse.json({ reply: openaiResult.reply, provider: openaiResult.provider });
    }

    // Use smart fallback
    const userMessage = messages.slice(-1)?.[0]?.content || '';
    const fallbackReply = getSmartFallback(userMessage);

    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  } catch (error) {
    logger.error('Chat API error', normalizeError(error, 'Chat API failed'), getErrorContext(error));
    const fallbackReply = `I'm having technical difficulties. Please call ${PLATFORM_DEFAULTS.supportPhone} or visit ${PLATFORM_DEFAULTS.canonicalDomain}/apply to get started!`;
    return NextResponse.json({ reply: fallbackReply, provider: 'demo' });
  }
}

export const POST = withRuntime(withApiAudit('/api/ai-chat', _POST));
