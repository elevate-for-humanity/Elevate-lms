import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createClient } from '@/utils/supabase/server';
import * as crypto from 'node:crypto';
import { checkPartnerApproval } from '@/lib/automation/partner-approval';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { documentId, signature, signatureType, role } = body;

    if (!documentId || !signature || !signatureType || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's profile to verify name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify signature matches name (case-insensitive)
    if (signature.trim().toLowerCase() !== profile.full_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Digital signature must match your name exactly.' },
        { status: 400 }
      );
    }

    // Get document to create hash
    const { data: document } = await supabase
      .from('onboarding_documents')
      .select('content, packet_id')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get packet version
    const { data: packet } = await supabase
      .from('onboarding_packets')
      .select('version')
      .eq('id', document.packet_id)
      .single();

    if (!packet) {
      return NextResponse.json({ error: 'Packet not found' }, { status: 404 });
    }

    // Create document hash (SHA256)
    const documentHash = crypto
      .createHash('sha256')
      .update(document.content)
      .digest('hex');

    // Get client IP and user agent
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert signature
    const { error: signError } = await supabase
      .from('onboarding_signatures')
      .insert({
        user_id: user.id,
        document_id: documentId,
        role: role,
        signature_data: signature.trim(),
        signature_type: signatureType,
        document_version: packet.version,
        document_hash: documentHash,
        ip_address: ip,
        user_agent: userAgent,
        signed_at: new Date().toISOString(),
        is_valid: true,
      });

    if (signError) {
      return NextResponse.json(
        { error: 'Failed to save signature' },
        { status: 500 }
      );
    }

    // Check if onboarding is complete
    const { data: completionCheck } = await supabase.rpc(
      'check_onboarding_completion',
      {
        p_user_id: user.id,
        p_role: role,
      }
    );

    // Update onboarding progress
    await supabase.rpc('complete_onboarding_step', {
      p_user_id: user.id,
      p_role: role,
    });

    // Trigger partner approval check for MOU signatures (non-blocking)
    if (process.env.AUTOMATION_ENABLE_TRIGGERS !== 'false') {
      if (role === 'partner' || role === 'program_holder' || documentId?.includes('mou')) {
        // Get partner_id from user's profile or partner record
        const { data: partnerRecord } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (partnerRecord?.id) {
          checkPartnerApproval(partnerRecord.id).catch((err) => {
            logger.error('Partner approval check error (non-blocking):', err);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      isComplete: completionCheck,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}
