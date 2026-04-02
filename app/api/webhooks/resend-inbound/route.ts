/**
 * Resend inbound webhook — DEPRECATED.
 * Inbound email is now handled by SendGrid Inbound Parse.
 * See: /api/webhooks/sendgrid-inbound
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated. Inbound email now uses SendGrid Inbound Parse at /api/webhooks/sendgrid-inbound' },
    { status: 410 },
  );
}
