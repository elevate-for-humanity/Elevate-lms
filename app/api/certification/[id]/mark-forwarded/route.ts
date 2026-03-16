// POST /api/certification/[id]/mark-forwarded
//
// Staff marks the authorization email as forwarded to the student.
// Advances status: exam_authorized → exam_forwarded → awaiting_upload

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { markForwarded } from '@/lib/services/exam-authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const result = await markForwarded(params.id, auth.user.id);
    if (!result.ok) return safeError(result.error ?? 'Failed to mark forwarded', 400);
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to mark forwarded');
  }
}
