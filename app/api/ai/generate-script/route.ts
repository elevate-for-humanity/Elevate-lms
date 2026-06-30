import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { courseTitle, moduleTitle, moduleDescription, duration } = await req.json();
    if (!moduleTitle) return NextResponse.json({ error: 'Module title is required' }, { status: 400 });

    const wordCount = duration * 150;
    const prompt = `You are an expert career coach creating video course content. Write a professional, engaging script for a video lesson.

Course: ${courseTitle}
Module: ${moduleTitle}
Description: ${moduleDescription}
Target Duration: ${duration} minutes (~${wordCount} words)

Guidelines:
- Write in a conversational, professional tone
- Start with a hook to grab attention
- Include practical, actionable advice
- Use examples and scenarios
- End with a clear summary and call-to-action
- Format for a talking-head video (no visual cues needed)
- Write approximately ${wordCount} words

Write the complete script now:`;

    const completion = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an expert career coach and instructional designer. You create engaging, practical video scripts that help people advance their careers.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 4000,
      temperature: 0.7,
    });

    return NextResponse.json({ script: completion.content || '' });
  } catch (error: any) {
    logger.error('Script generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/ai/generate-script', _POST);
