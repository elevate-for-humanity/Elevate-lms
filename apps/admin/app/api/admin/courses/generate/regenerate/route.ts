/**
 * POST /api/admin/courses/generate/regenerate
 *
 * Regenerates a single lesson given the course context.
 * Returns { lesson } — caller replaces the lesson in their draft state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { aiChat } from '@/lib/ai/ai-service';
import type { GeneratedLesson } from '../route';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { hydrateProcessEnv } from '@/lib/secrets';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  await hydrateProcessEnv();
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
    }

    const body = await req.json();
    const {
      lesson_number,
      lesson_title,
      module_title,
      course_title,
      instruction,
    }: {
      lesson_number: number;
      lesson_title: string;
      module_title: string;
      course_title: string;
      instruction?: string;
    } = body;

    const prompt = `Regenerate lesson ${lesson_number} "${lesson_title}" from module "${module_title}" in course "${course_title}".
${instruction ? `Additional instruction: ${instruction}` : ''}

Return ONLY a JSON object for a single lesson:
{
  "lesson_number": ${lesson_number},
  "title": "string",
  "description": "string",
  "objectives": ["string"],
  "content": "string — 200-500 words of real instructional content",
  "content_type": "video|reading|quiz|assignment",
  "duration_minutes": number,
  "is_required": true,
  "quiz_questions": [
    { "question": "string", "options": ["A","B","C","D"], "correct_index": 0, "explanation": "string" }
  ]
}
Minimum 2 quiz questions. Real instructional content only.`;

    const completion = await aiChat({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 2000,
    });

    const raw = completion.content;
    if (!raw) return NextResponse.json({ error: 'Empty response from AI service' }, { status: 500 });

    const lesson: GeneratedLesson = JSON.parse(raw);
    lesson.lesson_number = lesson_number; // enforce original number

    logger.info('Lesson regenerated', { userId: user.id, lesson_number, course_title });
    return NextResponse.json({ lesson });
  } catch (err: any) {
    logger.error('Regenerate error:', err);
    return NextResponse.json({ error: 'Regenerate failed' }, { status: 500 });
  }
}
