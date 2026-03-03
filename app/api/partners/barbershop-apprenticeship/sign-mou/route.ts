export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

interface MOUPayload {
  shop_name: string;
  signer_name: string;
  signer_title: string;
  supervisor_name: string;
  supervisor_license: string;
  compensation_model: string;
  compensation_rate: string;
  signature_data: string;
  signed_at: string;
  mou_version: string;
}

const VALID_COMPENSATION_MODELS = ['hourly', 'commission', 'hybrid'];

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body: MOUPayload = await req.json();

    // Validate required fields
    const required: (keyof MOUPayload)[] = [
      'shop_name', 'signer_name', 'signer_title',
      'supervisor_name', 'supervisor_license',
      'compensation_model', 'signature_data',
    ];

    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate compensation model
    if (!VALID_COMPENSATION_MODELS.includes(body.compensation_model)) {
      return NextResponse.json(
        { error: 'Invalid compensation model' },
        { status: 400 }
      );
    }

    // Validate signature data is a base64 PNG
    if (!body.signature_data.startsWith('data:image/png;base64,')) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
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

    // Insert into mou_signatures table with barber-specific fields
    const { error } = await supabase.from('mou_signatures').insert({
      organization_name: body.shop_name.trim(),
      contact_name: body.signer_name.trim(),
      contact_title: body.signer_title.trim(),
      contact_email: '',
      digital_signature: body.signature_data,
      signer_name: body.signer_name.trim(),
      signer_title: body.signer_title.trim(),
      supervisor_name: body.supervisor_name.trim(),
      supervisor_license: body.supervisor_license.trim(),
      compensation_model: body.compensation_model,
      compensation_rate: body.compensation_rate?.trim() || null,
      mou_version: body.mou_version || '2025-01',
      agreed: true,
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      signed_at: body.signed_at || new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to insert MOU signature', error);
      return NextResponse.json(
        { error: 'Unable to save MOU signature. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('MOU sign error', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/partners/barbershop-apprenticeship/sign-mou', _POST);
