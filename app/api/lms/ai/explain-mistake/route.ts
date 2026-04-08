import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);

  let body: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation?: string; // optional hint from the quiz data
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { question, userAnswer, correctAnswer, explanation } = body;
  if (!question || !userAnswer || !correctAnswer) {
    return NextResponse.json(
      { error: 'question, userAnswer, and correctAnswer are required' },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  const context = explanation ? `\nHint from course material: ${explanation}` : '';

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'You are a supportive tutor for a workforce training program. ' +
            'A learner got a quiz question wrong. Your job is to help them understand why, ' +
            'without making them feel bad. ' +
            'Be brief (3–4 sentences max), use plain language, and end with one key takeaway.',
        },
        {
          role: 'user',
          content:
            `Question: ${question}\n` +
            `Learner answered: ${userAnswer}\n` +
            `Correct answer: ${correctAnswer}` +
            context +
            '\n\nExplain why the learner\'s answer was incorrect and re-teach the concept simply.',
        },
      ],
    });

    const feedback = response.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ feedback });
  } catch (err) {
    logger.error('[ai/explain-mistake]', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
