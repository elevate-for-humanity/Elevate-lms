import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { prefix, suffix, language, filename } = await req.json();

    if (!prefix) {
      return NextResponse.json({ error: 'Prefix required' }, { status: 400 });
    }

    const prompt = `You are a code completion assistant. Complete the code at the cursor position.

File: ${filename || 'unknown'}
Language: ${language || 'unknown'}

Code before cursor:
${prefix.slice(-1500)}

Code after cursor:
${suffix?.slice(0, 500) || ''}

Provide ONLY the completion text, no explanation. Keep it short (1-3 lines typically).
If the context suggests a function call, variable, or common pattern, complete it.
Do not repeat what's already written.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 150,
      stop: ['\n\n', '```'],
    });

    const completion = response.choices[0].message.content?.trim() || '';

    return NextResponse.json({
      completion,
      usage: response.usage,
    });
  } catch (error) {
    logger.error('Completion error:', error);
    return NextResponse.json(
      { error: 'Failed to get completion' },
      { status: 500 }
    );
  }
}
