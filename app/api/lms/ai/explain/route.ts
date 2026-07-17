import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';

// Simple in-memory cache — keyed by content hash, evicted after 1 hour.
const cache = new Map<string, { result: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

function cacheKey(content: string) {
  return `${content.length}:${content.slice(0, 50)}:${content.slice(-50)}`;
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);

  let body: { content: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content } = body;
  if (!content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const trimmed = content.slice(0, 4000);
  const key = cacheKey(trimmed);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ simplified: cached.result, cached: true });
  }

  try {
    const response = await aiChat({
      model: 'gpt-4.1-mini',
      maxTokens: 800,
      messages: [
        {
          role: 'system',
          content:
            'You are a plain-language writing assistant for a workforce training program. ' +
            'Rewrite the provided lesson content at a 5th–6th grade reading level. ' +
            'Rules: use short sentences, everyday words, no jargon. ' +
            'Keep all key facts and steps. Add one concrete real-world example if helpful. ' +
            'Return plain text only — no markdown, no headers.',
        },
        { role: 'user', content: `Rewrite this lesson content in simple terms:\n\n${trimmed}` },
      ],
    });

    const simplified = response.content?.trim() ?? '';
    cache.set(key, { result: simplified, ts: Date.now() });
    return NextResponse.json({ simplified });
  } catch (err) {
    logger.error('[ai/explain]', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
