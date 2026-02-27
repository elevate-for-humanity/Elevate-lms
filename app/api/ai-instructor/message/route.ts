import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
          }),
        },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      logger.error(`Gemini ${model} error:`, err as Error);
    }
  }
  return null;
}

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

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { programId, lessonId, context = 'welcome' } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        message: fallbackMessages[context as keyof typeof fallbackMessages] || fallbackMessages.welcome,
        fallback: true,
      });
    }

    const systemPrompt =
      contextPrompts[context as keyof typeof contextPrompts] || contextPrompts.welcome;

    const userPrompt = `Generate an encouraging message for a student in program ${programId || 'general training'}, lesson ${lessonId || 'introduction'}.`;

    const message = await callGemini(systemPrompt, userPrompt);

    return NextResponse.json({
      message: message || fallbackMessages[context as keyof typeof fallbackMessages] || fallbackMessages.welcome,
      fallback: !message,
    });
  } catch (error) {
    logger.error('AI Instructor error:', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json({
      message: fallbackMessages.welcome,
      fallback: true,
    });
  }
}
export const POST = withApiAudit('/api/ai-instructor/message', _POST);
