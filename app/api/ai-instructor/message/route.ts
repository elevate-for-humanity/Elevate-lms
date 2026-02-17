import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const contextPrompts = {
  welcome:
    'You are a warm, encouraging AI instructor welcoming a new student to their training program. Be brief (2-3 sentences), supportive, and motivating.',
  lesson:
    'You are an AI instructor introducing a new lesson. Be encouraging, explain that learning takes time, and offer support. Keep it brief (2-3 sentences).',
  encouragement:
    'You are an AI instructor providing encouragement to a student who is progressing through their training. Be positive, specific, and motivating. Keep it brief (2-3 sentences).',
  completion:
    'You are an AI instructor congratulating a student on completing a module. Celebrate their achievement and encourage them to continue. Keep it brief (2-3 sentences).',
};

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

  // Fallback messages for when API is not configured
  const fallbackMessages = {
    welcome:
      "Welcome to your training program! I'm your AI instructor, here to guide you every step of the way. Together, we'll build the skills you need for a successful career. Let's get started!",
    lesson:
      "Let's dive into this lesson together. Remember, learning is a journey - take your time, ask questions, and don't be afraid to make mistakes. Every expert was once a beginner!",
    encouragement:
      "You're making excellent progress! Your dedication and hard work are truly paying off. Keep pushing forward - you're closer to your goals than you think!",
    completion:
      "Congratulations on completing this module! This is a significant achievement. Take a moment to celebrate your success, then get ready for the next exciting challenge ahead!",
  };

  try {
    const { programId, lessonId, context = 'welcome' } = await req.json();

    // If no OpenAI configured, return helpful fallback
    if (!openai) {
      return NextResponse.json({
        message: fallbackMessages[context as keyof typeof fallbackMessages] || fallbackMessages.welcome,
        fallback: true
      });
    }

    const systemPrompt =
      contextPrompts[context as keyof typeof contextPrompts] ||
      contextPrompts.welcome;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Generate an encouraging message for a student in program ${programId || 'general training'}, lesson ${lessonId || 'introduction'}.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const message =
      completion.choices[0]?.message?.content ||
      "Welcome! I'm here to support your learning journey.";

    // Optional: Generate audio with ElevenLabs
    // const audioUrl = await generateAudio(message);

    return NextResponse.json({
      message,
      // audioUrl,
    });
  } catch (error) { 
    logger.error(
      'AI Instructor error:',
      error instanceof Error ? error : new Error(String(error))
    );

    const context = 'welcome';

    return NextResponse.json({
      message:
        fallbackMessages[context as keyof typeof fallbackMessages] ||
        fallbackMessages.welcome,
    });
  }
}
