export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      user_id,
      quiz_score,
      quiz_answers,
      training_signature,
      confidentiality_signature,
      training_acknowledged,
      confidentiality_acknowledged,
      ip_address,
      user_agent
    } = body;

    // Validate required fields
    if (!quiz_score || quiz_score < 80) {
      return NextResponse.json(
        { error: 'Quiz score must be 80% or higher' },
        { status: 400 }
      );
    }

    if (!training_signature || !confidentiality_signature) {
      return NextResponse.json(
        { error: 'Both signatures are required' },
        { status: 400 }
      );
    }

    if (!training_acknowledged || !confidentiality_acknowledged) {
      return NextResponse.json(
        { error: 'All acknowledgments are required' },
        { status: 400 }
      );
    }

    // Generate certificate ID
    const certificate_id = `FERPA-${Date.now()}-${user_id.substring(0, 8)}`;

    // Insert training record
    const { data: trainingRecord, error: trainingError } = await db
      .from('ferpa_training_records')
      .insert({
        id: certificate_id,
        user_id,
        quiz_score,
        quiz_answers,
        training_signature,
        confidentiality_signature,
        training_acknowledged,
        confidentiality_acknowledged,
        completed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        ip_address,
        user_agent,
        status: 'completed'
      })
      .select()
      .single();

    if (trainingError) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to save training record' },
        { status: 500 }
      );
    }

    // Log the completion
    await db.from('audit_logs').insert({
      user_id,
      action: 'ferpa_training_completed',
      resource_type: 'ferpa_training',
      resource_id: certificate_id,
      details: {
        quiz_score,
        certificate_id,
        ip_address,
        user_agent
      }
    });

    // Send confirmation email (optional)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/ferpa-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          certificate_id,
          quiz_score
        })
      });
    } catch (emailError) {
        logger.error("Unhandled error", emailError instanceof Error ? emailError : undefined);
    }

    return NextResponse.json({
      success: true,
      certificate_id,
      training_record: trainingRecord
    });

  } catch (error) { 
    // Error: $1
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/ferpa/training/submit', _POST);
