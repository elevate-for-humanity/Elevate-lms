import { NextRequest } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function authorize(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return { response: rateLimited };
  const auth = await apiRequireDevStudio(request);
  return auth.error ? { response: auth.error } : { auth };
}

export async function GET(request: NextRequest) {
  const authorization = await authorize(request);
  if ('response' in authorization) return authorization.response;

  const resolved = request.nextUrl.searchParams.get('resolved') === 'true';
  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('studio_review_comments')
      .select('id, file_path, branch, line_start, line_end, content, resolved, created_at')
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }
    return jsonOk({ comments: data ?? [] });
  } catch (error) {
    return safeInternalError(error, 'Failed to load Studio review comments');
  }
}

export async function POST(request: NextRequest) {
  const authorization = await authorize(request);
  if ('response' in authorization) return authorization.response;

  try {
    const body = await request.json().catch(() => ({}));
    const filePath = String(body.filePath ?? '').trim();
    const content = String(body.content ?? '').trim();
    const branch = String(body.branch ?? 'main').trim();
    const lineStart = Number(body.lineStart ?? 1);
    const lineEnd = body.lineEnd == null ? null : Number(body.lineEnd);
    if (!filePath || filePath.length > 500) return safeError('A valid file path is required', 400);
    if (!content || content.length > 4000) return safeError('A review comment is required', 400);
    if (!branch || branch.length > 200) return safeError('A valid branch is required', 400);
    if (!Number.isInteger(lineStart) || lineStart < 1) return safeError('Line must be a positive integer', 400);
    if (lineEnd !== null && (!Number.isInteger(lineEnd) || lineEnd < lineStart)) {
      return safeError('End line must be at or after the start line', 400);
    }

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('studio_review_comments')
      .insert({
        created_by: authorization.auth.id,
        file_path: filePath,
        branch,
        line_start: lineStart,
        line_end: lineEnd,
        content,
      })
      .select('id, file_path, branch, line_start, line_end, content, resolved, created_at')
      .single();
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }
    return jsonOk({ comment: data }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to create Studio review comment');
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorize(request);
  if ('response' in authorization) return authorization.response;

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '').trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return safeError('A valid comment ID is required', 400);
    }

    const resolved = body.resolved !== false;
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('studio_review_comments')
      .update({
        resolved,
        resolved_by: resolved ? authorization.auth.id : null,
        resolved_at: resolved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, resolved')
      .maybeSingle();
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }
    if (!data) return safeError('Comment not found', 404);
    return jsonOk({ comment: data });
  } catch (error) {
    return safeInternalError(error, 'Failed to update Studio review comment');
  }
}
