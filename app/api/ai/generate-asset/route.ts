import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      {
        error:
          'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
      },
      { status: 500 }
    );
  }

  const { type, prompt, style } = await request.json();

  if (!type || !prompt) {
    return NextResponse.json(
      { error: 'Type and prompt required' },
      { status: 400 }
    );
  }

  try {
    if (type === 'image') {
      // Generate image with DALL-E
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: `${prompt}. Style: ${style || 'professional, modern'}`,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: error.error?.message || 'DALL-E API error' },
          { status: 500 }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        type: 'image',
        url: data.data[0].url,
        prompt,
      });
    } else if (type === 'content') {
      // Generate content with GPT-4
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional content writer. Create engaging, well-structured content.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: error.error?.message || 'OpenAI API error' },
          { status: 500 }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        type: 'content',
        content: data.choices[0].message.content,
        prompt,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "image" or "content"' },
        { status: 400 }
      );
    }
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'AI Asset Generator error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate asset' },
      { status: 500 }
    );
  }
}
