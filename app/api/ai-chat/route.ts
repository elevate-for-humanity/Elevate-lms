

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json().catch(() => null);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback response when API key is not configured
      const userMessage = body?.messages?.slice(-1)?.[0]?.content?.toLowerCase() || '';
      
      let fallbackReply = `Thanks for reaching out! I'm here to help you learn about Elevate for Humanity's free career training programs.

**Quick Info:**
• Training is 100% FREE for eligible Indiana residents through WIOA funding
• Programs: Healthcare (CNA), Skilled Trades (HVAC, CDL), Barbering, and more
• Call us: (317) 314-3757
• Apply online: elevateforhumanity.org/apply

What would you like to know more about?`;

      if (userMessage.includes('apply') || userMessage.includes('start') || userMessage.includes('enroll')) {
        fallbackReply = `Great! Here's how to apply:

1. Visit **elevateforhumanity.org/apply**
2. Complete the eligibility questionnaire (10-15 min)
3. Upload required documents (ID, proof of income)
4. Schedule your orientation

Training may be available at no cost for eligible participants. Call (317) 314-3757 if you need help.`;
      } else if (userMessage.includes('program') || userMessage.includes('course') || userMessage.includes('training')) {
        fallbackReply = `We offer funded training in:

**Healthcare:** CNA, Phlebotomy, Medical Assistant
**Skilled Trades:** HVAC, Electrical, CDL Truck Driving
**Professional:** Barbering, Cosmetology
**Technology:** IT Fundamentals, Microsoft Office

All programs include job placement assistance! Visit elevateforhumanity.org/programs for details.`;
      } else if (userMessage.includes('free') || userMessage.includes('cost') || userMessage.includes('pay') || userMessage.includes('money')) {
        fallbackReply = `Many programs are available at no cost to eligible participants through:

• **WIOA** - For low-income individuals
• **Job Ready Indy** - For justice-involved individuals  
• **WRG** - Indiana Workforce Ready Grant

Check your eligibility at elevateforhumanity.org/wioa-eligibility or call (317) 314-3757.`;
      } else if (userMessage.includes('eligib') || userMessage.includes('qualify')) {
        fallbackReply = `To qualify for funded training, you generally need to be:

✓ Indiana resident
✓ 18+ years old
✓ US citizen or authorized to work
✓ Meet income guidelines (varies by family size)

Check your eligibility at elevateforhumanity.org/wioa-eligibility or call (317) 314-3757 for help!`;
      } else if (userMessage.includes('contact') || userMessage.includes('call') || userMessage.includes('phone') || userMessage.includes('person') || userMessage.includes('human')) {
        fallbackReply = `You can reach our team at:

📞 **Phone:** (317) 314-3757
📧 **Email:** info@elevateforhumanity.org
🌐 **Website:** elevateforhumanity.org

We're here to help you start your career journey!`;
      }

      return NextResponse.json({ reply: fallbackReply });
    }

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Missing messages array" },
        { status: 400 }
      );
    }

    // Safety: only keep role/content
    const messages = body.messages.map((item: any) => ({
      role: item.role === "user" ? "user" : "assistant",
      content: String(item.content || "")
    }));

    const systemPrompt = `
You are the Elevate for Humanity AI Assistant - a warm, helpful guide for prospective students.

**CRITICAL: Always be helpful and answer the question directly. Never say you can't help.**

**About Us:**
- Nonprofit workforce training in Indianapolis, Indiana
- DOL Registered Apprenticeship Sponsor (Barber program)
- WIOA & Job Ready Indy approved - Training is 100% FREE for eligible participants

**Our Programs:**
- Healthcare: CNA ($1,200 - payment plans available), Phlebotomy, Medical Assistant
- Skilled Trades: HVAC, CDL Truck Driving, Electrical, Plumbing
- Professional: Barbering Apprenticeship, Cosmetology
- Technology: IT Fundamentals, Microsoft Office

**Who Qualifies for FREE Training:**
- Indiana residents
- 18+ years old (some programs 17+)
- Low-income individuals (WIOA funding)
- Justice-involved individuals (Job Ready Indy funding)
- Veterans and their families

**How to Apply:**
1. Visit elevateforhumanity.org/apply
2. Fill out the quick application (10 min)
3. We'll check your eligibility for free training
4. Start your new career!

**Contact:**
- Phone: (317) 314-3757
- Email: info@elevateforhumanity.org
- Website: elevateforhumanity.org

**Response Guidelines:**
- Be warm, encouraging, and direct
- Answer the specific question asked
- Use bullet points for lists
- Always provide a clear next step
- If unsure, say "Great question! Call us at (317) 314-3757 for details"
- Keep responses under 150 words
- End with an action: apply link, phone number, or follow-up question
    `.trim();

    const payload = {
      model: "gpt-4o-mini", // Using gpt-4o-mini instead of gpt-5.1-mini
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      logger.error("OpenAI error:", err);
      
      // Return a helpful fallback instead of error
      const userMessage = body?.messages?.slice(-1)?.[0]?.content?.toLowerCase() || '';
      let fallbackReply = "I'm having a moment! Let me help you another way:\n\n";
      
      if (userMessage.includes('program') || userMessage.includes('training')) {
        fallbackReply += "**Our Programs:**\n• Healthcare (CNA, Phlebotomy)\n• Skilled Trades (HVAC, CDL)\n• Professional (Barbering)\n\nVisit elevateforhumanity.org/programs or call (317) 314-3757";
      } else if (userMessage.includes('apply') || userMessage.includes('start')) {
        fallbackReply += "**To Apply:**\n1. Go to elevateforhumanity.org/apply\n2. Complete the form\n3. We'll contact you!\n\nOr call (317) 314-3757";
      } else {
        fallbackReply += "Please call us at **(317) 314-3757** or visit **elevateforhumanity.org** and we'll help you right away!";
      }
      
      return NextResponse.json({ reply: fallbackReply });
    }

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content ??
      "I couldn't generate a response. Please call us at (317) 314-3757 for immediate help!";

    // Log interaction to database
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = body?.messages?.slice(-1)?.[0]?.content || '';
      await supabase.from('ai_chat_interactions').insert({
        user_id: user?.id || null,
        user_message: userMessage,
        assistant_response: reply,
        model: 'gpt-4o-mini',
      }).catch(() => {});
    } catch (err) {
        logger.error("Unhandled error", err instanceof Error ? err : undefined);
      }

    return NextResponse.json({ reply });
  } catch (error) {
    logger.error("Chat API error:", error);
    return NextResponse.json({ 
      reply: "I'm having technical difficulties. Please call us at (317) 314-3757 or visit elevateforhumanity.org/apply to get started!" 
    });
  }
}
export const POST = withApiAudit('/api/ai-chat', _POST);
