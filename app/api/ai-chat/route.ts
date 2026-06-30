import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function _POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const userMessage = body?.messages?.slice(-1)?.[0]?.content?.toLowerCase() || '';

      let fallbackReply = "Thanks for reaching out! I'm here to help you learn about " +
        PLATFORM_DEFAULTS.orgName + "'s free career training programs.\n\n" +
        "**Quick Info:**\n" +
        "• Training is 100% FREE for eligible Indiana residents through WIOA funding\n" +
        "• Programs: Healthcare (CNA), Skilled Trades (HVAC, CDL), Barbering, and more\n" +
        "• Call us: " + PLATFORM_DEFAULTS.supportPhone + "\n" +
        "• Apply online: " + PLATFORM_DEFAULTS.canonicalDomain + "/apply\n\n" +
        "What would you like to know more about?";

      if (
        userMessage.includes('apply') ||
        userMessage.includes('start') ||
        userMessage.includes('enroll')
      ) {
        fallbackReply = "Great! Here's how to apply:\n\n" +
          "1. Visit **" + PLATFORM_DEFAULTS.canonicalDomain + "/apply**\n" +
          "2. Complete the eligibility questionnaire (10-15 min)\n" +
          "3. Upload required documents (ID, proof of income)\n" +
          "4. Schedule your orientation\n\n" +
          "Training may be available at no cost for eligible participants. Call " +
          PLATFORM_DEFAULTS.supportPhone + " if you need help.";
      } else if (
        userMessage.includes('program') ||
        userMessage.includes('course') ||
        userMessage.includes('training')
      ) {
        fallbackReply = "We offer funded training in:\n\n" +
          "**Healthcare:** CNA, Phlebotomy, Medical Assistant\n" +
          "**Skilled Trades:** HVAC, Electrical, CDL Truck Driving\n" +
          "**Professional:** Barbering, Cosmetology\n" +
          "**Technology:** IT Fundamentals, Microsoft Office\n\n" +
          "Graduates receive career placement support (not a guaranteed job). Visit " +
          PLATFORM_DEFAULTS.canonicalDomain + "/programs for details.";
      } else if (
        userMessage.includes('free') ||
        userMessage.includes('cost') ||
        userMessage.includes('pay') ||
        userMessage.includes('money')
      ) {
        fallbackReply = "Many programs are available at no cost to eligible participants through:\n\n" +
          "• **WIOA** - For low-income individuals\n" +
          "• **Job Ready Indy** - For justice-involved individuals\n" +
          "• **WRG** - Indiana Workforce Ready Grant\n\n" +
          "Check your eligibility at " + PLATFORM_DEFAULTS.canonicalDomain + "/wioa-eligibility or call " +
          PLATFORM_DEFAULTS.supportPhone + ".";
      } else if (
        userMessage.includes('eligib') ||
        userMessage.includes('qualify')
      ) {
        fallbackReply = "To qualify for funded training, you generally need to be:\n\n" +
          "✓ Indiana resident\n" +
          "✓ 18+ years old\n" +
          "✓ US citizen or authorized to work\n" +
          "✓ Meet income guidelines (varies by family size)\n\n" +
          "Check your eligibility at " + PLATFORM_DEFAULTS.canonicalDomain + "/wioa-eligibility or call " +
          PLATFORM_DEFAULTS.supportPhone + " for help!";
      } else if (
        userMessage.includes('contact') ||
        userMessage.includes('call') ||
        userMessage.includes('phone') ||
        userMessage.includes('person') ||
        userMessage.includes('human')
      ) {
        fallbackReply = "You can reach our team at:\n\n" +
          "📞 **Phone:** " + PLATFORM_DEFAULTS.supportPhone + "\n" +
          "📧 **Email:** info@" + PLATFORM_DEFAULTS.canonicalDomain + "\n" +
          "🌐 **Website:** " + PLATFORM_DEFAULTS.canonicalDomain + "\n\n" +
          "We're here to help you start your career journey!";
      }

      return NextResponse.json({ reply: fallbackReply });
    }

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Missing messages array' }, { status: 400 });
    }

    const messages = body.messages.map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: String(item.content || ''),
    }));

    const systemPrompt = "You are the " + PLATFORM_DEFAULTS.orgName + " AI Assistant - a warm, helpful guide for prospective students.\n\n" +
      "**CRITICAL: Always be helpful and answer the question directly. Never say you can't help.**\n\n" +
      "**About Us:**\n" +
      "- Nonprofit workforce training in Indianapolis, Indiana\n" +
      "- DOL Registered Apprenticeship Sponsor (Barber program)\n" +
      "- WIOA & Job Ready Indy approved - Training is 100% FREE for eligible participants\n\n" +
      "**Our Programs:**\n" +
      "- Healthcare: CNA ($1,200 - payment plans available), Phlebotomy, Medical Assistant\n" +
      "- Skilled Trades: HVAC, CDL Truck Driving, Electrical, Plumbing\n" +
      "- Professional: Barbering Apprenticeship, Cosmetology\n" +
      "- Technology: IT Fundamentals, Microsoft Office\n\n" +
      "**Who Qualifies for FREE Training:**\n" +
      "- Indiana residents\n" +
      "- 18+ years old (some programs 17+)\n" +
      "- Low-income individuals (WIOA funding)\n" +
      "- Justice-involved individuals (Job Ready Indy funding)\n" +
      "- Veterans and their families\n\n" +
      "**How to Apply:**\n" +
      "1. Visit " + PLATFORM_DEFAULTS.canonicalDomain + "/apply\n" +
      "2. Fill out the quick application (10 min)\n" +
      "3. We'll check your eligibility for free training\n" +
      "4. Start your new career!\n\n" +
      "**Contact:**\n" +
      "- Phone: " + PLATFORM_DEFAULTS.supportPhone + "\n" +
      "- Email: info@" + PLATFORM_DEFAULTS.canonicalDomain + "\n" +
      "- Website: elevateforhumanity.org\n\n" +
      "**Response Guidelines:**\n" +
      "- Be warm, encouraging, and direct\n" +
      "- Answer the specific question asked\n" +
      "- Use bullet points for lists\n" +
      "- Always provide a clear next step\n" +
      "- If unsure, say \"Great question! Call us at " + PLATFORM_DEFAULTS.supportPhone + " for details\"\n" +
      "- Keep responses under 150 words\n" +
      "- End with an action: apply link, phone number, or follow-up question";

    const payload = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    };

    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      logger.error('OpenAI error:', err);

      const userMessage = body?.messages?.slice(-1)?.[0]?.content?.toLowerCase() || '';
      let fallbackReply = "I'm having a moment! Let me help you another way:\n\n";

      if (userMessage.includes('program') || userMessage.includes('training')) {
        fallbackReply += "**Our Programs:**\n• Healthcare (CNA, Phlebotomy)\n• Skilled Trades (HVAC, CDL)\n• Professional (Barbering)\n\nVisit " +
          PLATFORM_DEFAULTS.siteUrl + "/programs or call " + PLATFORM_DEFAULTS.supportPhone;
      } else if (userMessage.includes('apply') || userMessage.includes('start')) {
        fallbackReply += "**To Apply:**\n1. Go to " + PLATFORM_DEFAULTS.siteUrl + "/apply\n2. Complete the form\n3. We'll contact you!\n\nOr call " +
          PLATFORM_DEFAULTS.supportPhone;
      } else {
        fallbackReply += "Please call us at **" + PLATFORM_DEFAULTS.supportPhone +
          "** or visit **elevateforhumanity.org** and we'll help you right away!";
      }

      return NextResponse.json({ reply: fallbackReply });
    }

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content ??
      "I couldn't generate a response. Please call us at " + PLATFORM_DEFAULTS.supportPhone + " for immediate help!";

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = body?.messages?.slice(-1)?.[0]?.content || '';
      await supabase
        .from('ai_chat_interactions')
        .insert({
          user_id: user?.id || null,
          user_message: userMessage,
          assistant_response: reply,
          model: 'gpt-4o-mini',
        })
        .then(() => {}, () => {});
    } catch (err) {
      logger.error('Unhandled error', err instanceof Error ? err : undefined);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    logger.error('Chat API error:', error);
    return NextResponse.json({
      reply: "I'm having technical difficulties. Please call us at " +
        PLATFORM_DEFAULTS.supportPhone + " or visit " +
        PLATFORM_DEFAULTS.siteUrl + "/apply to get started!",
    });
  }
}

export const POST = withRuntime(withApiAudit('/api/ai-chat', _POST));
