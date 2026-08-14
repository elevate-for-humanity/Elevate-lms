/**
 * /api/devstudio/jobs
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
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100);
  const status = searchParams.get('status') ?? 'all';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const db = await requireAdminClient();
    let query = db
      .from('devstudio_jobs')
      .select('id, command, status, log_lines, tool_name, started_at, finished_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      // Table may not exist yet — return empty list gracefully
      if (error.code === '42P01') return NextResponse.json({ jobs: [] });
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const body = await request.json().catch(() => ({}));
    const command: string = body.command ?? '';
    if (!command.trim()) return safeError('command is required', 400);

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('devstudio_jobs')
      .insert({ user_id: user.id, command, status: 'running', log_lines: [] })
      .select('id')
      .single();

    if (error) {
      // Table not yet created — return a temp ID so the UI still works
      if (error.code === '42P01') {
        return NextResponse.json({ jobId: `temp-${Date.now()}` });
      }
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
    const { jobId, lines, status, finished_at } = body as {
      jobId: string;
      lines?: string[];
      status?: string;
      finished_at?: string;
    };

    if (!jobId || jobId.startsWith('temp-')) {
      // Temp IDs (table not yet created) — silently succeed
      return NextResponse.json({ ok: true });
    }

    const db = await requireAdminClient();

    // Append lines via jsonb_array_elements concat
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (finished_at) updates.finished_at = finished_at;

    if (lines && lines.length > 0) {
      // Use raw SQL to append to the jsonb array atomically
      const { error } = await db.rpc('devstudio_append_log', {
        p_job_id: jobId,
        p_lines: lines,
      }).single();

      // If RPC doesn't exist yet, fall back to a full replace via select+update
      if (error && error.code === 'PGRST202') {
        const { data: existing } = await db
          .from('devstudio_jobs')
          .select('log_lines')
          .eq('id', jobId)
          .single();
        const current: string[] = (existing?.log_lines as string[]) ?? [];
        updates.log_lines = [...current, ...lines];
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.from('devstudio_jobs').update(updates).eq('id', jobId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to update job');
  }
}
