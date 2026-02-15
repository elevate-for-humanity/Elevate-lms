import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { code, cursorPosition, filename, language } = await req.json();

    // Get code before and after cursor
    const lines = code.split('\n');
    const beforeCursor = lines.slice(0, cursorPosition.line).join('\n') + 
      '\n' + lines[cursorPosition.line]?.substring(0, cursorPosition.column) || '';
    const afterCursor = (lines[cursorPosition.line]?.substring(cursorPosition.column) || '') +
      '\n' + lines.slice(cursorPosition.line + 1).join('\n');

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a code completion assistant. Complete the code at the cursor position.
Return ONLY the completion text, no explanations. Keep completions short (1-3 lines typically).
Language: ${language || 'typescript'}
Filename: ${filename || 'unknown'}`,
        },
        {
          role: 'user',
          content: `Complete this code at [CURSOR]:

${beforeCursor}[CURSOR]${afterCursor}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const completion = response.choices[0].message.content || '';

    return NextResponse.json({
      completion: completion.trim(),
      usage: response.usage,
    });
  } catch (error) {
    logger.error('Code completion error:', error);
    return NextResponse.json(
      { error: 'Failed to get completion' },
      { status: 500 }
    );
  }
}
