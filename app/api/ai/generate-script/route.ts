import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

  const openai = getOpenAIClient();
  try {
    const { courseTitle, moduleTitle, moduleDescription, duration } = await req.json();

    if (!moduleTitle) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 });
    }

    const wordCount = duration * 150; // ~150 words per minute for natural speech

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and instructional designer. You create engaging, practical video scripts that help people advance their careers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const script = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ script });
  } catch (error: any) {
    logger.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
