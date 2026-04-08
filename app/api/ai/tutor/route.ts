import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: 'AI features not configured. Please set OPENAI_API_KEY.' },
      { status: 503 }
    );
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, question } = await req.json();

  // Fetch course content for context
  const { data: course } = await supabase
    .from('training_courses')
    .select(
      `
      *,
      modules:course_modules(
        *,
        lessons:lessons(*)
      )
    `
    )
    .eq('id', courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const context = JSON.stringify({
    title: course.course_name,
    description: course.description,
    modules: course.modules,
  });

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an LMS tutor helping students understand course material. Answer questions clearly and concisely, providing examples when helpful. If the question is outside the course scope, politely redirect to the course content.',
        },
        {
          role: 'user',
          content: `Course content: ${context}\n\nStudent Question: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (error) { 
    logger.error(
      'AI tutor error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to get answer' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/ai/tutor', _POST));
