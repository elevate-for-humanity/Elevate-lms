import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import {
  runTabularIntelligenceBatch,
  type TabularIntelligenceMode,
  type TabularIntelligenceRequest,
} from '@/lib/ai/tabular-intelligence';

const MODES = new Set<TabularIntelligenceMode>([
  'generate',
  'summarize',
  'categorize',
  'sentiment',
  'extract',
]);

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
    return safeError('rows must be a non-empty array', 400);
  }
  if (body.rows.length > 100) {
    return safeError('A maximum of 100 rows can be analyzed per request', 400);
  }

  const mode = body.mode as TabularIntelligenceMode;
  if (!MODES.has(mode)) {
    return safeError('mode must be generate, summarize, categorize, sentiment, or extract', 400);
  }

  const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';
  if (!instruction) return safeError('instruction is required', 400);

  const categories = Array.isArray(body.categories)
    ? body.categories.filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    : undefined;

  if (mode === 'categorize' && categories && categories.length > 50) {
    return safeError('A maximum of 50 categories is allowed', 400);
  }

  const requests: TabularIntelligenceRequest[] = body.rows.map((row: unknown) => ({
    mode,
    instruction,
    row: row && typeof row === 'object' && !Array.isArray(row) ? row as Record<string, unknown> : { value: row },
    categories,
    outputKey: typeof body.outputKey === 'string' ? body.outputKey.trim() || undefined : undefined,
  }));

  try {
    const results = await runTabularIntelligenceBatch(requests, 4);
    return NextResponse.json({
      success: true,
      mode,
      count: results.length,
      results,
    });
  } catch (error) {
    return safeError(
      error instanceof Error ? error.message : 'Tabular intelligence failed',
      503,
    );
  }
}
