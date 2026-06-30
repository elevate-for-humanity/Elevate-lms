/**
 * POST /api/admin/studio/tool-execute
 *
 * Executes a Studio AI tool action server-side.
 * Called by the AI panel when the AI returns a tool_call.
 *
 * Body: { courseId, toolName, args }
 * Returns: { ok, message, data }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeStudioTool, type StudioToolName } from '@/lib/studio/tools';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { courseId?: string; toolName?: string; args?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseId, toolName, args = {} } = body;

  if (!courseId || !toolName) {
    return NextResponse.json({ error: 'courseId and toolName required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  try {
    const result = await executeStudioTool(
      toolName as StudioToolName,
      args,
      courseId,
      auth.user.id,
      db,
    );

    logger.info('[studio/tool-execute]', {
      toolName,
      courseId,
      userId: auth.user.id,
      ok: result.ok,
    });

    return NextResponse.json(result);
  } catch (err) {
    logger.error('[studio/tool-execute] unexpected error', err instanceof Error ? err : undefined, {
      toolName,
      courseId,
    });
    return NextResponse.json({ ok: false, message: 'Tool execution failed' }, { status: 500 });
  }
}
