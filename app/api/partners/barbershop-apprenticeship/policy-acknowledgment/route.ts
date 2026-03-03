export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

interface AcknowledgmentPayload {
  shop_name: string;
  signer_name: string;
  policies_acknowledged: string[];
  acknowledged_at: string;
}

// All policy IDs that must be acknowledged (must match the page)
const REQUIRED_POLICIES = [
  'handbook',
  'eeo',
  'safety',
  'confidentiality',
  'compensation-compliance',
  'reporting',
];

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body: AcknowledgmentPayload = await req.json();

    // Validate required fields
    if (!body.shop_name?.trim()) {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      );
    }

    if (!body.signer_name?.trim()) {
      return NextResponse.json(
        { error: 'Signer name is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.policies_acknowledged) || body.policies_acknowledged.length === 0) {
      return NextResponse.json(
        { error: 'At least one policy must be acknowledged' },
        { status: 400 }
      );
    }

    // Verify all required policies are acknowledged
    const missing = REQUIRED_POLICIES.filter(p => !body.policies_acknowledged.includes(p));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing policy acknowledgments: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      logger.error('Supabase admin client not available');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Insert into policy_acknowledgments table
    // If the table doesn't exist yet, fall back to a generic audit record
    const record = {
      shop_name: body.shop_name.trim(),
      signer_name: body.signer_name.trim(),
      policies_acknowledged: body.policies_acknowledged,
      acknowledged_at: body.acknowledged_at || new Date().toISOString(),
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    };

    // Try the dedicated table first
    const { error } = await supabase
      .from('partner_policy_acknowledgments')
      .insert(record);

    if (error) {
      // Table may not exist yet — log and try mou_signatures as fallback
      logger.error('Failed to insert policy acknowledgment (primary table)', error);

      // Fallback: store in mou_signatures with a marker
      const { error: fallbackError } = await supabase
        .from('mou_signatures')
        .insert({
          organization_name: body.shop_name.trim(),
          contact_name: body.signer_name.trim(),
          contact_title: 'Policy Acknowledgment',
          contact_email: '',
          digital_signature: `POLICY_ACK:${body.policies_acknowledged.join(',')}`,
          agreed: true,
          ip_address: record.ip_address,
          user_agent: record.user_agent,
          signed_at: record.acknowledged_at,
        });

      if (fallbackError) {
        logger.error('Failed to insert policy acknowledgment (fallback)', fallbackError);
        return NextResponse.json(
          { error: 'Unable to save acknowledgment. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('Policy acknowledgment error', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/partners/barbershop-apprenticeship/policy-acknowledgment', _POST);
