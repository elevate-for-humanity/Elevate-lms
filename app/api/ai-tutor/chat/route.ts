import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are an AI tutor for Elevate for Humanity, a workforce development platform in Indianapolis, Indiana. You help students studying for career certifications in healthcare, skilled trades, technology, business, and other fields. Provide clear, accurate, educational responses. Reference Indiana-specific licensing requirements, employers, and resources when relevant. Keep responses focused and practical.`,
  essay: `You are an essay writing assistant for Elevate for Humanity students. Help students improve their writing with constructive feedback, structural suggestions, grammar corrections, and clarity improvements. Be encouraging but honest.`,
  'study-guide': `You are a study guide creator for Elevate for Humanity students preparing for career certification exams. Create comprehensive study materials including key concepts, definitions, practice questions, and exam tips. Structure content clearly with headers and bullet points.`,
};

const FALLBACK_RESPONSES: Record<string, string[]> = {
  chat: [
    "I'm here to help you with your studies! While my AI capabilities are being configured, here are some tips:\n\n1. **Break down complex topics** into smaller, manageable parts\n2. **Use active recall** - test yourself instead of just re-reading\n3. **Teach what you learn** to someone else\n4. **Take regular breaks** using the Pomodoro technique\n\nFor specific questions about your coursework, please reach out to your instructor or check the course materials.",
  ],
  essay: [
    "I'm your essay writing assistant! Here's a solid essay structure:\n\n**Introduction:** Hook, background context, clear thesis statement\n**Body Paragraphs:** Topic sentence, evidence/examples, analysis, transition\n**Conclusion:** Restate thesis, summarize key points, final thought\n\nRemember: Strong essays have clear arguments supported by evidence!",
  ],
  'study-guide': [
    "Let me help you create a study guide! Here's a template:\n\n**Topic: [Your Subject]**\n\n**Key Concepts:**\n1. [Main idea 1]\n2. [Main idea 2]\n\n**Important Terms:**\n- Term 1: Definition\n- Term 2: Definition\n\n**Practice Questions:**\n1. Question about concept 1\n2. Question about concept 2\n\nFill this in with your course content for an effective study guide!",
  ],
};

async function callGemini(messages: Array<{ role: string; content: string }>, systemPrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Convert chat history to Gemini format
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  // Try models in order of preference
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    // If 429 (rate limit), try next model
    if (response.status === 429) continue;

    // Other errors — don't retry
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logger.error(`Gemini ${model} error:`, err);
      break;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, conversationId, mode } = await request.json();

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // No AI keys configured — return fallback
  if (!geminiKey && !openaiKey) {
    const responses = FALLBACK_RESPONSES[mode as string] || FALLBACK_RESPONSES.chat;
    return NextResponse.json({
      message: responses[Math.floor(Math.random() * responses.length)],
      conversationId: null,
      fallback: true,
    });
  }

  try {
    // Get conversation history if exists
    let messages: Array<{ role: string; content: string }> = [];
    if (conversationId) {
      const { data: history } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (history) {
        messages = history.messages || [];
      }
    }

    // Add user message
    messages.push({ role: 'user', content: message });

    const systemPrompt = SYSTEM_PROMPTS[mode as string] || SYSTEM_PROMPTS.chat;
    let aiContent: string | null = null;

    // Try Gemini first (free), fall back to OpenAI
    if (geminiKey) {
      aiContent = await callGemini(messages, systemPrompt);
    }

    // Fall back to OpenAI if Gemini fails and key exists
    if (!aiContent && openaiKey) {
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiContent = data.choices?.[0]?.message?.content;
      }
    }

    // Both failed — return fallback
    if (!aiContent) {
      const responses = FALLBACK_RESPONSES[mode as string] || FALLBACK_RESPONSES.chat;
      return NextResponse.json({
        message: responses[Math.floor(Math.random() * responses.length)],
        conversationId: null,
        fallback: true,
      });
    }

    // Add AI response to messages
    messages.push({ role: 'assistant', content: aiContent });

    // Save or update conversation
    let newConversationId = conversationId;
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          mode,
          messages,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      newConversationId = newConv?.id;
    } else {
      await supabase
        .from('conversations')
        .update({ messages })
        .eq('id', conversationId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      message: aiContent,
      conversationId: newConversationId,
    });
  } catch (error) {
    logger.error(
      'AI Tutor error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to process request' },
      { status: 500 }
    );
  }
}
