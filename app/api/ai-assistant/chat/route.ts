import { logger } from '@/lib/logger';
/**
 * AI Assistant Chat API
 * 
 * Provides real AI-powered responses for the AIAssistantBubble component.
 * Stores conversation history in database for continuity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 30;

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are the Elevate for Humanity AI Assistant. You help visitors navigate the website and learn about workforce training programs.

Key information about Elevate for Humanity:
- Nonprofit workforce development organization in Indianapolis, Indiana
- Offers FREE career training through WIOA (Workforce Innovation and Opportunity Act) funding
- Programs include: Healthcare (CNA, Medical Assistant, Phlebotomy), Skilled Trades (HVAC, Electrical, Welding), Technology (IT Support, Cybersecurity), CDL Training, Barbering
- Also serves JRI (Justice Reinvestment Initiative) participants
- Phone: 317-314-3757
- Website sections: /programs, /wioa-eligibility, /apply, /about, /contact

Your role:
- Be friendly, helpful, and concise
- Guide users to relevant pages with markdown links like [View Programs](/programs)
- Help with eligibility questions
- Encourage users to apply or contact the team
- If asked something you don't know, direct them to call 317-314-3757

Keep responses brief (2-4 sentences) unless more detail is needed.`;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user if authenticated (optional for chat)
    const { data: { user } } = await supabase.auth.getUser();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await db
        .from('ai_assistant_conversations')
        .insert({
          user_id: user?.id || null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      convId = newConv?.id;
    }

    // Get conversation history
    const { data: history } = await db
      .from('ai_assistant_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build messages array for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...(history || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      "I'm sorry, I couldn't process that. Please try again or call 317-314-3757 for help.";

    // Save messages to database
    if (convId) {
      await db.from('ai_assistant_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: assistantMessage },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      conversationId: convId,
    });

  } catch (error) {
    logger.error('AI Assistant error:', error);
    
    // Fallback response if AI fails
    return NextResponse.json({
      success: true,
      message: "I'm having trouble connecting right now. Please call us at 317-314-3757 or visit our [Contact Page](/contact) for assistance.",
      conversationId: null,
    });
  }
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    name: 'AI Assistant Chat API',
    version: '1.0.0',
    description: 'Powers the AIAssistantBubble chat widget',
  });
}
export const GET = withApiAudit('/api/ai-assistant/chat', _GET);
export const POST = withApiAudit('/api/ai-assistant/chat', _POST);
