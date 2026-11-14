import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { composeVisual } from '@/lib/ai/visual-composition';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

const schema = z.object({
  mode: z.enum(['create', 'refine', 'beautify', 'infographic']),
  instruction: z.string().trim().min(3).max(4_000),
  target: z.enum(['slide', 'section', 'hero', 'program-card', 'infographic', 'course-visual']).optional(),
  current: z.record(z.string(), z.unknown()).optional(),
  sourceContext: z.record(z.string(), z.unknown()).optional(),
  theme: z.object({
    brandName: z.string().trim().max(120).optional(),
    tone: z.string().trim().max(240).optional(),
    fonts: z.array(z.string().trim().max(80)).max(8).optional(),
    colors: z.array(z.string().trim().max(40)).max(12).optional(),
    styleNotes: z.array(z.string().trim().max(240)).max(12).optional(),
  }).optional(),
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
      { ok: false, error: 'Invalid visual composition request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.mode !== 'create' && !parsed.data.current) {
    return safeError('current composition is required for refine or beautify operations', 400);
  }

  try {
    const spec = await composeVisual(parsed.data);
    return NextResponse.json({ ok: true, spec });
  } catch (error) {
    return safeInternalError(error, 'Visual composition failed');
  }
}
