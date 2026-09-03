/**
 * GET  /api/admin/programs/[programId]/versions
 *   Returns version history for a program, newest first.
 *
 * POST /api/admin/programs/[programId]/versions
 *   Publishes the program (snapshots state, increments version).
 *   Body (optional): {} — no payload needed.
 *   Returns: { ok, version }
 *
 * PUT  /api/admin/programs/[programId]/versions
 *   Rolls back to a specific version.
 *   Body: { version: number }
 *   Returns: { ok, rolledBackTo }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import {
  publishProgram,
  rollbackProgram,
  listProgramVersions,
} from '@/lib/course-builder/program-versioning';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rl = await applyRateLimit(request, 'api');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const versions = await listProgramVersions(db, programId);
  return NextResponse.json({ ok: true, versions });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Enforce approval gate — program must be in 'approved' state before publish.
  const { data: prog } = await db
    .from('programs')
    .select('review_status')
    .eq('id', programId)
    .maybeSingle();

  if (prog && prog.review_status !== 'approved') {
    return safeError(
      `Program must be approved before publishing. Current status: '${prog.review_status}'. ` +
        `Submit for review via POST /api/admin/programs/${programId}/review`,
      409,
    );
  }

  const result = await publishProgram(db, programId, auth.id);
  if (!result.ok) return safeError(result.error ?? 'Publish failed', 500);

  return NextResponse.json({ ok: true, version: result.version });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rl = await applyRateLimit(request, 'strict');
  if (rl) return rl;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.version || typeof body.version !== 'number') {
    return safeError('version (number) required', 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const result = await rollbackProgram(db, programId, body.version, auth.id);
  if (!result.ok) return safeError(result.error ?? 'Rollback failed', 500);

  return NextResponse.json({ ok: true, rolledBackTo: result.rolledBackTo });
}
