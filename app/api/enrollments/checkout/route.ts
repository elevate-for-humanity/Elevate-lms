/**
 * @deprecated Use POST /api/programs/enroll/checkout
 *
 * // PUBLIC ROUTE: Legacy alias — same forward path as /api/checkout/create-session.
 */
import type { NextRequest } from 'next/server';
import { forwardEnrollmentCheckout } from '@/lib/checkout/enrollment-checkout-forward';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  return forwardEnrollmentCheckout(request, '/api/enrollments/checkout', 'program');
}

export const POST = withApiAudit('/api/enrollments/checkout', _POST);
