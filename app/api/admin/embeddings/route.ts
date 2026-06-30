/**
 * POST /api/admin/embeddings
 *
 * Trigger lesson embedding for a course.
 * Body: { courseId, force?: boolean }
 *
 * Admin only. Runs in background — returns immediately with job status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { embedCourseLessons } from '@/lib/embeddings/embed-lessons';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { courseId?: string; force?: boolean };
  try { body = await request.json(); } catch { body = {}; }

  const { courseId, force = false } = body;
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

  const result = await embedCourseLessons(db, courseId, { force });
  return NextResponse.json(result);
}
