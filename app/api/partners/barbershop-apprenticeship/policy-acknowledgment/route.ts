export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      shop_name,
      signer_name,
      policies_acknowledged,
      acknowledged_at,
    } = body || {};

    if (!shop_name || !signer_name) {
      return NextResponse.json(
        { error: 'Shop name and signer name are required.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(policies_acknowledged) || policies_acknowledged.length === 0) {
      return NextResponse.json(
        { error: 'You must acknowledge at least one policy.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Find matching application
    const { data: application } = await supabase
      .from('barbershop_partner_applications')
      .select('id, status')
      .ilike('shop_legal_name', shop_name.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Store acknowledgment in compliance_records
    const { error: insertError } = await supabase
      .from('compliance_records')
      .insert({
        record_type: 'policy_acknowledgment',
        entity_type: 'barbershop_partner',
        entity_id: application?.id || null,
        signer_name: signer_name.trim(),
        metadata: {
          shop_name: shop_name.trim(),
          policies_acknowledged,
          acknowledged_at: acknowledged_at || new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: req.headers.get('user-agent') || 'unknown',
        },
        status: 'completed',
      });

    if (insertError) {
      // If compliance_records doesn't exist, try a generic insert
      logger.warn('[policy-ack] compliance_records insert failed, trying partner_mous:', insertError);

      const { error: fallbackError } = await supabase
        .from('partner_mous')
        .insert({
          mou_version: 'policy-ack-v1',
          status: 'signed',
          signed_at: acknowledged_at || new Date().toISOString(),
          terms: {
            type: 'policy_acknowledgment',
            shop_name: shop_name.trim(),
            signer_name: signer_name.trim(),
            policies_acknowledged,
            ip_address: ipAddress,
          },
        });

      if (fallbackError) {
        logger.error('[policy-ack] Fallback insert also failed:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to save acknowledgment. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Update application status if found
    if (application?.id) {
      await supabase
        .from('barbershop_partner_applications')
        .update({
          status: 'policies_acknowledged',
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);
    }

    logger.info(`[policy-ack] Policies acknowledged by ${signer_name} for ${shop_name}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[policy-ack] Error:', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/partners/barbershop-apprenticeship/policy-acknowledgment', _POST);
