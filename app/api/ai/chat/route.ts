/**
 * @deprecated Route to lib/ai/orchestrator.ts for new callers.
 * This endpoint is preserved for backwards compatibility.
 * Migration: runAITask({ task: 'general_chat' | 'instructor_support', ... })
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChat } from '@/lib/ai/ai-service';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';



async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const db = (await requireAdminClient()) || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get AI assignment
    const { data: assignment, error: assignmentError } = await db
      .from('student_ai_assignments')
      .select(
        `
        instructor_id,
        program_slug,
        ai_instructors(system_prompt, name)
      `,
      )
      .eq('student_id', user.id)
      .maybeSingle();

    if (!assignment || assignmentError) {
      return NextResponse.json(
        { error: 'No AI instructor assigned. Please contact support.' },
        { status: 400 },
      );
    }

    // Get or create chat session
    let { data: session } = await db
      .from('ai_chat_sessions')
      .select('*')
      .eq('student_id', user.id)
      .eq('program_slug', assignment.program_slug)
      .maybeSingle();

    if (!session) {
      const { data: newSession, error: sessionError } = await db
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
        return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
      }

      session = newSession;
    }

    // Save user message
    await db.from('chat_messages').insert({
      session_id: session.id,
      role: 'user',
      content: message,
    });

    // Mark AI instructor met on first message
    try {
      await db
        .from('student_onboarding')
        .update({ ai_instructor_met: true })
        .eq('student_id', user.id)
        .eq('ai_instructor_met', false);
    } catch (onboardingError) {
      logger.error(
        'Unhandled error',
        onboardingError instanceof Error ? onboardingError : undefined,
      );
    }

    // Pull recent history
    const { data: history } = await db
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Use shared AI service — provider fallback chain handled in lib/ai/ai-service.ts
    const result = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            (assignment.ai_instructors as any)?.system_prompt || 'You are a helpful instructor.',
        },
        ...(history || []).map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      maxTokens: 500,
    });

    const reply = result.content || "I'm here to help!";

    // Save assistant message
    await db.from('chat_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    // Error: $1
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to process chat' },
      { status: 500 },
    );
  }
}

// Get chat history
async function _GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const db = (await requireAdminClient()) || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const { data: session } = await db
      .from('ai_chat_sessions')
      .select('id')
      .eq('student_id', user.id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ messages: [] });
    }

    // Get messages
    const { data: messages } = await db
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    // Error: $1
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/ai/chat', _GET);
export const POST = withApiAudit('/api/ai/chat', _POST);
