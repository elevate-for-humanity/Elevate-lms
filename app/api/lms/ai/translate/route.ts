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

const SUPPORTED_LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  en: 'English',
};

const cache = new Map<string, { result: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

function cacheKey(content: string, lang: string) {
  return `${lang}:${content.length}:${content.slice(0, 50)}:${content.slice(-50)}`;
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);

  let body: { content: string; targetLang: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content, targetLang } = body;
  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (!targetLang || !SUPPORTED_LANGUAGES[targetLang]) {
    return NextResponse.json(
      { error: `Unsupported language. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}` },
      { status: 400 }
    );
  }

  const trimmed = content.slice(0, 4000);
  const key = cacheKey(trimmed, targetLang);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ translated: cached.result, lang: targetLang, cached: true });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  const langName = SUPPORTED_LANGUAGES[targetLang];

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            `You are a professional translator for workforce training materials. ` +
            `Translate the provided lesson content into ${langName}. ` +
            `Rules: preserve all technical terms accurately (e.g. HVAC, EPA, OSHA, CNA). ` +
            `Keep the same structure and paragraph breaks. ` +
            `Do not add commentary. Return the translation only.`,
        },
        {
          role: 'user',
          content: `Translate to ${langName}:\n\n${trimmed}`,
        },
      ],
    });

    const translated = response.choices[0]?.message?.content?.trim() ?? '';
    cache.set(key, { result: translated, ts: Date.now() });

    return NextResponse.json({ translated, lang: targetLang });
  } catch (err) {
    logger.error('[ai/translate]', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
