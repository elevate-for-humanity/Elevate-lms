import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * AI Chat Response API
 * OpenAI integration for intelligent chat responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { conversation_id, message, user_id, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!openai) {
      // Fallback response when OpenAI is not configured
      return NextResponse.json({
        response: `Thanks for your message! I'm here to help you learn about our programs.

**Quick Info:**
• Training is 100% FREE for eligible Indiana residents through WIOA funding
• Programs: Healthcare (CNA), Skilled Trades (HVAC, CDL), Barbering, and more
• Call us: (317) 314-3757
• Apply online: elevateforhumanity.org/apply

What would you like to know more about?`,
        needs_human: false,
      });
    }

    // Build context from previous messages if provided
    const conversationHistory = context?.previousMessages?.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })) || [];

    // System prompt for the AI
    const systemPrompt = `You are the Elevate for Humanity AI Assistant - a helpful, friendly guide for prospective students and visitors.

**About Elevate for Humanity:**
- Nonprofit workforce development organization in Indianapolis, Indiana
- DOL Registered Apprenticeship Sponsor (Barber program)
- WIOA-approved training provider
- JRI-approved for justice-involved individuals
- Training is 100% FREE for eligible participants

**Programs We Offer:**
- Healthcare: CNA, Phlebotomy, Medical Assistant, Peer Recovery Specialist
- Skilled Trades: HVAC, Electrical, Plumbing, Construction
- Transportation: CDL Truck Driving
- Professional: Barbering, Cosmetology, Business Administration
- Technology: IT Fundamentals, Microsoft Office Certification

**Funding Options:**
- WIOA (Workforce Innovation and Opportunity Act) - Free for eligible low-income individuals
- WRG (Workforce Ready Grant) - Indiana state funding
- JRI (Justice Reinvestment Initiative) - For justice-involved individuals
- Self-pay options with payment plans available

**Eligibility (General):**
- Indiana resident
- 18 years or older (some programs 17+)
- US citizen or authorized to work
- Meet income guidelines for WIOA (varies by family size)

**How to Apply:**
1. Visit elevateforhumanity.org/apply
2. Complete the eligibility questionnaire
3. Upload required documents
4. Schedule orientation

**Contact:**
- Phone: (317) 314-3757
- Email: info@elevateforhumanity.org
- Address: Indianapolis, Indiana

**Your Role:**
- Be friendly, encouraging, and supportive
- Answer questions about programs, eligibility, and the application process
- Help visitors find the right program for their goals
- Provide clear next steps
- If you don't know something specific, direct them to contact us or visit the website
- Never make guarantees about job placement or specific outcomes
- For complaints, refunds, or complex issues, direct to phone support

Keep responses concise but helpful. Use bullet points for clarity when listing information.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      'I apologize, but I encountered an error. Please call us at (317) 314-3757 for assistance.';

    // Check if human handoff is needed
    const needsHuman =
      message.toLowerCase().includes('speak to human') ||
      message.toLowerCase().includes('talk to agent') ||
      message.toLowerCase().includes('real person') ||
      message.toLowerCase().includes('complaint') ||
      message.toLowerCase().includes('refund');

    // Try to save context to database (non-blocking)
    if (conversation_id) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await supabase.from('ai_chat_context').insert({
          conversation_id,
          context_data: {
            messages: conversationHistory,
            last_prompt: message,
            last_response: aiResponse,
          },
          tokens_used: completion.usage?.total_tokens || 0,
          model: 'gpt-4o-mini',
        });
      } catch (err) {
          logger.error("Unhandled error", err instanceof Error ? err : undefined);
        }
    }

    return NextResponse.json({
      response: aiResponse,
      needs_human: needsHuman,
      tokens_used: completion.usage?.total_tokens || 0,
    });
  } catch (err: any) {
    logger.error('AI Chat error:', err);
    return NextResponse.json({
      response: "I'm having a bit of trouble right now. Please call us at (317) 314-3757 or visit elevateforhumanity.org/apply to get started!",
      needs_human: true,
    });
  }
}
