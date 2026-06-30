/**
 * @deprecated Use POST /api/programs/enroll/checkout
 *
 * // PUBLIC ROUTE: Pre-auth checkout session — forwards to canonical enroll checkout
 * with program slug validation inside forwardEnrollmentCheckout().
 */
import type { NextRequest } from 'next/server';
import { forwardEnrollmentCheckout } from '@/lib/checkout/enrollment-checkout-forward';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  return forwardEnrollmentCheckout(req, '/api/checkout/create-session', 'program');
}

export const POST = withApiAudit('/api/checkout/create-session', _POST);
