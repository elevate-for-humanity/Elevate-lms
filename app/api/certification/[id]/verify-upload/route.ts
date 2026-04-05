// POST /api/certification/[id]/verify-upload
//
// Admin approves or rejects the student's uploaded exam result.
// On approval: issues Elevate certificate + sends student email.
// On rejection: student is prompted to re-upload.

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { verifyUploadAndIssueCertificate } from '@/lib/services/exam-authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);

  try {
    const { approved, rejection_reason } = await request.json();
    if (typeof approved !== 'boolean') return safeError('approved (boolean) required', 400);
    if (!approved && !rejection_reason) return safeError('rejection_reason required when rejecting', 400);

    const result = await verifyUploadAndIssueCertificate(
      params.id,
      auth.id,
      approved,
      rejection_reason
    );

    if (!result.ok) return safeError(result.error ?? 'Verification failed', 400);

    return NextResponse.json({
      success: true,
      ...(result.certificateId ? { certificate_id: result.certificateId } : {}),
    });
  } catch (err) {
    return safeInternalError(err, 'Verification failed');
  }
}
