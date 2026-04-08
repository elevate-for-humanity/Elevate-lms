

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('student_ai_assignments')
      .select(
        `
        instructor_id,
        program_slug,
        ai_instructors(system_prompt, name)
      `
      )
      .eq('student_id', user.id)
      .single();

    if (!assignment || assignmentError) {
      return NextResponse.json(
        { error: 'No AI instructor assigned. Please contact support.' },
        { status: 400 }
      );
    }

    // Get or create chat session
    let { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('*')
      .eq('student_id', user.id)
      .eq('program_slug', assignment.program_slug)
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .insert({
          student_id: user.id,
          instructor_id: assignment.instructor_id,
          program_slug: assignment.program_slug,
        })
        .select()
        .single();

      if (sessionError) {
        // Error: $1
        return NextResponse.json(
          { error: 'Failed to create chat session' },
          { status: 500 }
        );
      }

      session = newSession;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      role: 'user',
      content: message,
    });

    // Mark AI instructor met on first message
    try {
      await supabase
        .from('student_onboarding')
        .update({ ai_instructor_met: true })
        .eq('student_id', user.id)
        .eq('ai_instructor_met', false);
    } catch (onboardingError) {
        logger.error("Unhandled error", onboardingError instanceof Error ? onboardingError : undefined);
    }

    // Pull recent history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // OpenAI call
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            (assignment.ai_instructors as any)?.system_prompt ||
            'You are a helpful instructor.',
        },
        ...(history || []).map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content || "I'm here to help!";

    // Save assistant message
    await supabase.from('chat_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to process chat' },
      { status: 500 }
    );
  }
}

// Get chat history
async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const { data: session } = await supabase
      .from('ai_chat_sessions')
      .select('id')
      .eq('student_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ messages: [] });
    }

    // Get messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ messages: messages || [] });
  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to load chat history' },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/ai/chat', _GET));
export const POST = withRuntime(withApiAudit('/api/ai/chat', _POST));
