import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { askKnowledge } from '@/lib/ai/knowledge-intelligence';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

const sourceSchema = z.object({
  id: z.string().trim().min(1).max(180),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(25_000),
  type: z.string().trim().max(80).optional(),
  updatedAt: z.string().trim().max(80).optional(),
  location: z.string().trim().max(500).optional(),
});

const schema = z.object({
  mode: z.enum(['answer', 'summarize', 'compare', 'actions', 'risks']).default('answer'),
  question: z.string().trim().min(2).max(4_000),
  sources: z.array(sourceSchema).min(1).max(20),
  maxSources: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid knowledge request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await askKnowledge(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return safeInternalError(error, 'Knowledge analysis failed');
  }
}
