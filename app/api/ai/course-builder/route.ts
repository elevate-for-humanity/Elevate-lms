import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
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
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, level, tenantId } = await req.json();

  const prompt = `
Create a full LMS course structure on "${topic}" for workforce development at ${level || 'intermediate'} level.
Include:
- 6 modules with clear learning objectives
- 4–8 lessons per module with detailed content outlines
- Quiz questions for each module (5-10 questions)
- Final exam blueprint with 20-30 questions
- Hands-on lab tasks and practical exercises
- WIOA-aligned skills mapping
- SCORM-friendly structure with sequencing
- Estimated completion time for each module
- Prerequisites and recommended background

Format as JSON with this structure:
{
  "title": "Course Title",
  "description": "Course description",
  "modules": [
    {
      "title": "Module Title",
      "objectives": ["objective 1", "objective 2"],
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Lesson content outline",
          "duration_minutes": 30
        }
      ],
      "quiz": [
        {
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": "A"
        }
      ]
    }
  ]
}
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;

    const { data: course } = await db
      .from('ai_generated_courses')
      .insert({
        tenant_id: tenantId,
        topic,
        level,
        output: content!,
      })
      .select()
      .single();

    return NextResponse.json({ course, content });
  } catch (error) { 
    logger.error(
      'AI course builder error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate course' },
      { status: 500 }
    );
  }
}
