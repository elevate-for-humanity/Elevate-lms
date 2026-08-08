import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 200);
  const resolved = request.nextUrl.searchParams.get('resolved');

  try {
    const db = await requireAdminClient();
    let query = db
      .from('studio_comments')
      .select('id,user_id,repo_id,file_path,branch,line_start,line_end,content,resolved,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (resolved === 'true' || resolved === 'false') query = query.eq('resolved', resolved === 'true');
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ comments: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return safeInternalError(error, 'Failed to load Studio comments');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const filePath = String(body.filePath ?? body.file_path ?? '').trim();
    const content = String(body.content ?? '').trim();
    const lineStart = Number(body.lineStart ?? body.line_start ?? 1);
    if (!filePath || !content) return safeError('filePath and content are required', 400);
    if (!Number.isInteger(lineStart) || lineStart < 1) return safeError('lineStart must be a positive integer', 400);

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('studio_comments')
      .insert({
        user_id: auth.id,
        repo_id: body.repoId ?? body.repo_id ?? null,
        file_path: filePath,
        branch: body.branch ? String(body.branch) : 'main',
        line_start: lineStart,
        line_end: body.lineEnd ?? body.line_end ?? null,
        content,
        resolved: false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to create Studio comment');
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '').trim();
    if (!id) return safeError('id is required', 400);

    const db = await requireAdminClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.resolved === 'boolean') patch.resolved = body.resolved;
    if (typeof body.content === 'string' && body.content.trim()) patch.content = body.content.trim();

    const { data, error } = await db
      .from('studio_comments')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ comment: data });
  } catch (error) {
    return safeInternalError(error, 'Failed to update Studio comment');
  }
}
