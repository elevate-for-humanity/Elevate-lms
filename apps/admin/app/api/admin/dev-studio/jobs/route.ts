/**
 * /api/admin/dev-studio/jobs
 *
 * Persistent Dev Studio job queue. Stores every command run so sessions
 * survive page reloads and disconnects.
 *
 * GET  ?limit=20&status=all   → list recent jobs for the current user
 * POST { command }            → create a new job row, returns { jobId }
 * PATCH { jobId, lines?, status?, finished_at? } → append log lines / mark done
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── GET — list recent jobs ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const requestedLimit = Number(searchParams.get('limit') ?? 30);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 100)) : 30;
  const status = searchParams.get('status') ?? 'all';

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await requireAdminClient();
    let query = db
      .from('devstudio_jobs')
      .select(
        'id, command, status, stage, progress, result, error, attempts, max_attempts, log_lines, tool_name, tool_args, started_at, finished_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet — return empty list gracefully
      if (error.code === '42P01') return safeError('Job storage is unavailable', 503);
      return safeError('Failed to fetch jobs', 500);
    }

    return NextResponse.json({ jobs: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch jobs');
  }
}

// ── POST — create a new job ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return safeError('Invalid request body', 400);
    const command = body?.command;
    if (typeof command !== 'string' || !command.trim()) return safeError('command is required', 400);

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('devstudio_jobs')
      .insert({ user_id: user.id, command, status: 'running', log_lines: [] })
      .select('id')
      .single();

    if (error) {
      if (error.code === '42P01') return safeError('Job storage is unavailable', 503);
      return safeError('Failed to create job', 500);
    }

    return NextResponse.json({ jobId: data.id });
  } catch (err) {
    return safeInternalError(err, 'Failed to create job');
  }
}

// ── PATCH — append log lines or mark job done ─────────────────────────────────

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object' || Array.isArray(body)) return safeError('Invalid request body', 400);
    const { jobId, lines, status, finished_at } = body as {
      jobId: string;
      lines?: string[];
      status?: string;
      finished_at?: string;
    };

    if (typeof jobId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
      return safeError('A persisted jobId is required', 400);
    }
    if (lines !== undefined && (!Array.isArray(lines) || lines.some(line => typeof line !== 'string'))) {
      return safeError('lines must be an array of strings', 400);
    }
    if (status !== undefined && !['queued', 'running', 'completed', 'failed', 'cancelled'].includes(status)) {
      return safeError('Invalid job status', 400);
    }
    if (finished_at !== undefined && (typeof finished_at !== 'string' || !Number.isFinite(Date.parse(finished_at)))) {
      return safeError('Invalid finish time', 400);
    }

    const db = await requireAdminClient();
    // The service client bypasses RLS: authorize ownership before invoking the log RPC.
    const { data: job, error: lookupError } = await db.from('devstudio_jobs')
      .select('id').eq('id', jobId).eq('user_id', auth.userId).maybeSingle();
    if (lookupError) return safeError('Failed to load job', 500);
    if (!job) return safeError('Job not found', 404);

    if (lines && lines.length > 0) {
      // This void RPC has no row representation; .single() produces a false error.
      const { error } = await db.rpc('devstudio_append_log', { p_job_id: jobId, p_lines: lines });
      if (error) return safeError('Failed to append job logs', 500);
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (finished_at !== undefined) updates.finished_at = finished_at;
    if (Object.keys(updates).length > 0) {
      const { data: updated, error } = await db.from('devstudio_jobs').update(updates)
        .eq('id', jobId).eq('user_id', auth.userId).select('id').maybeSingle();
      if (error) return safeError('Failed to update job', 500);
      if (!updated) return safeError('Job not found', 404);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to update job');
  }
}
