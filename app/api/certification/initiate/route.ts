// POST /api/certification/initiate
//
// Triggered when a student's enrollment is marked complete.
// Runs readiness check, creates certification_request, initiates Stripe charge.
// Works for all programs — external exam, external course+exam, or internal proctor.

import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { initiateCertification, checkCertificationReadiness } from '@/lib/services/exam-authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const { program_id, pathway_id, check_only } = await request.json();
    if (!program_id) return safeError('program_id required', 400);

    // check_only=true returns readiness without initiating — used by student dashboard
    if (check_only) {
      const readiness = await checkCertificationReadiness(auth.user.id, program_id);
      return NextResponse.json(readiness);
    }

    const result = await initiateCertification(auth.user.id, program_id, pathway_id ?? undefined);
    if (!result.ok) return safeError(result.error ?? 'Initiation failed', 400);

    return NextResponse.json(result.result, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to initiate certification');
  }
}
