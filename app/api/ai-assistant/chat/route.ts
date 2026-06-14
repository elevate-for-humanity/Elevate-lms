import { logger } from '@/lib/logger';
/**
 * AI Assistant Chat API
 *
 * Provides AI-powered responses for the AIAssistantBubble component.
 * Stores conversation history when the chat tables are available, but public
 * chat must keep responding even when AI or database services are degraded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 30;

type AssistantHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function buildAssistantFallback(message: string): string {
  const normalized = message.toLowerCase();
  const supportLine = `You can also call ${PLATFORM_DEFAULTS.supportPhone} or use the [Contact Page](/contact).`;

  if (/\b(cna|nursing assistant|nurse aide)\b/.test(normalized)) {
    return `The CNA program is 4 weeks and prepares students for the Indiana CNA written and skills exam. Self-pay is currently listed at $1,850, regular price $2,500, and FSSA IMPACT funding may cover eligible SNAP/TANF participants. BNPL/self-pay options are available. Start here: [Apply for CNA](/apply?program=cna). ${supportLine}`;
  }

  if (/\b(qma|medication aide)\b/.test(normalized)) {
    return `The QMA / Medication Aide pathway is for current CNAs who want medication-administration training. Self-pay and BNPL options are available, and funding eligibility can be checked before enrollment. Start here: [QMA Program](/programs/qma). ${supportLine}`;
  }

  if (/\b(cost|price|tuition|payment|pay|bnpl|finance|financing|installment|self-pay|self pay)\b/.test(normalized)) {
    return `Program pages should show the current training cost, funding options, and self-pay/BNPL availability. Eligible students may qualify for WIOA, FSSA IMPACT, Workforce Ready Grant, employer sponsorship, or payment options depending on the program. Start here: [Payment Options](/funding/payment-options) or [Check Eligibility](/apply). ${supportLine}`;
  }

  if (/\b(apply|application|enroll|start|sign up|signup)\b/.test(normalized)) {
    return `You can start the application online and choose the program you want during intake. Use [Apply for Training](/apply), then admissions can verify funding and next cohort availability. ${supportLine}`;
  }

  if (/\b(program|class|course|training|certificate|certification)\b/.test(normalized)) {
    return `${PLATFORM_DEFAULTS.orgName} offers healthcare, skilled trades, beauty/apprenticeship, technology, and business training pathways. Browse the current list here: [All Programs](/programs). ${supportLine}`;
  }

  return `I can help with programs, funding, BNPL/self-pay options, eligibility, and applications. Try asking about a specific program like CNA, QMA, HVAC, Barber Apprenticeship, or Bookkeeping. ${supportLine}`;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let supabase: any = null;
    let userId: string | undefined;
    let convId = typeof conversationId === 'string' ? conversationId : null;
    let history: AssistantHistoryMessage[] = [];

    try {
      supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;

      if (!convId) {
        const { data: newConv, error: conversationError } = await supabase
          .from('ai_assistant_conversations')
          .insert({
            user_id: userId || null,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (conversationError) {
          logger.warn('AI Assistant conversation create failed', {
            error: conversationError.message,
          });
        }
        convId = newConv?.id ?? null;
      }

      if (convId) {
        const { data: existingHistory, error: historyError } = await supabase
          .from('ai_assistant_messages')
          .select('role, content')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (historyError) {
          logger.warn('AI Assistant history lookup failed', { error: historyError.message });
        } else {
          history = (existingHistory ?? [])
            .filter(
              (msg: any) =>
                (msg.role === 'user' || msg.role === 'assistant') &&
                typeof msg.content === 'string',
            )
            .map((msg: any) => ({ role: msg.role, content: msg.content }));
        }
      }
    } catch (databaseError) {
      logger.warn('AI Assistant database unavailable; continuing without history', { databaseError });
    }

    let assistantMessage: string;

    try {
      const { runAITask } = await import('@/lib/ai/orchestrator');
      const aiResult = await runAITask({
        task: 'prospective_student_chat',
        prompt: message,
        context: { history, userId },
        maxTokens: 300,
      });

      assistantMessage =
        aiResult.content || buildAssistantFallback(message);
    } catch (aiError) {
      if (isAiDegradedError(aiError)) {
        logger.warn('AI Assistant degraded; using guided fallback', {
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      } else {
        logger.error('AI Assistant model unavailable; using guided fallback:', aiError);
      }
      assistantMessage = buildAssistantFallback(message);
    }

    if (supabase && convId) {
      try {
        const { error: saveError } = await supabase.from('ai_assistant_messages').insert([
          { conversation_id: convId, role: 'user', content: message },
          { conversation_id: convId, role: 'assistant', content: assistantMessage },
        ]);
        if (saveError) {
          logger.warn('AI Assistant message save failed', { error: saveError.message });
        }
      } catch (saveError) {
        logger.warn('AI Assistant message save threw', { saveError });
      }
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      conversationId: convId,
    });
  } catch (error) {
    logger.error('AI Assistant request error:', error);

    return NextResponse.json({
      success: true,
      message: buildAssistantFallback(''),
      conversationId: null,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'AI Assistant Chat API',
    version: '1.0.0',
    description: 'Powers the AIAssistantBubble chat widget',
  });
}
