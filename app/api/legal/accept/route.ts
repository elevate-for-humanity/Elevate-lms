import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AgreementType = 'eula' | 'tos' | 'aup' | 'disclosures' | 'license' | 'nda' | 'mou';

interface AcceptanceRequest {
  agreements: AgreementType[];
  context?: 'checkout' | 'first_login' | 'upgrade' | 'renewal';
  stripe_session_id?: string;
  organization_id?: string;
}

/**
 * POST /api/legal/accept
 * Records user acceptance of legal agreements
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AcceptanceRequest = await request.json();
    const { agreements, context, stripe_session_id, organization_id } = body;

    if (!agreements || !Array.isArray(agreements) || agreements.length === 0) {
      return NextResponse.json({ error: 'agreements array required' }, { status: 400 });
    }

    // Get request metadata
    const headersList = await headers();
    const ip_address = headersList.get('x-forwarded-for')?.split(',')[0] || 
                       headersList.get('x-real-ip') || 
                       'unknown';
    const user_agent = headersList.get('user-agent') || 'unknown';

    // Get current versions for each agreement type
    const { data: versions, error: versionsError } = await db
      .from('agreement_versions')
      .select('agreement_type, current_version, document_url')
      .in('agreement_type', agreements);

    if (versionsError) {
      logger.error('Error fetching agreement versions:', versionsError);
      return NextResponse.json({ error: 'Failed to fetch agreement versions' }, { status: 500 });
    }

    // Create acceptance records
    const acceptances = agreements.map(agreementType => {
      const version = versions?.find(v => v.agreement_type === agreementType);
      return {
        user_id: user.id,
        organization_id: organization_id || null,
        agreement_type: agreementType,
        document_version: version?.current_version || '1.0',
        document_url: version?.document_url || `/legal/${agreementType}`,
        accepted_at: new Date().toISOString(),
        ip_address,
        user_agent,
        acceptance_context: context || 'first_login',
        stripe_session_id: stripe_session_id || null,
      };
    });

    // Insert acceptances (upsert to handle re-acceptance of same version)
    const { data: inserted, error: insertError } = await db
      .from('license_agreement_acceptances')
      .upsert(acceptances, { 
        onConflict: 'user_id,agreement_type,document_version',
        ignoreDuplicates: true 
      })
      .select();

    if (insertError) {
      logger.error('Error recording acceptances:', insertError);
      return NextResponse.json({ error: 'Failed to record acceptance' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      accepted: agreements,
      timestamp: new Date().toISOString(),
      message: `Accepted ${agreements.length} agreement(s)`
    });

  } catch (error) {
    logger.error('Agreement acceptance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/legal/accept
 * Check which agreements user has accepted
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all current versions
    const { data: versions } = await db
      .from('agreement_versions')
      .select('agreement_type, current_version');

    // Get user's acceptances
    const { data: acceptances } = await db
      .from('license_agreement_acceptances')
      .select('agreement_type, document_version, accepted_at')
      .eq('user_id', user.id);

    // Check which are current
    const required: AgreementType[] = ['eula', 'tos', 'aup', 'disclosures'];
    const status: Record<string, { accepted: boolean; version?: string; accepted_at?: string }> = {};

    for (const type of required) {
      const currentVersion = versions?.find(v => v.agreement_type === type)?.current_version;
      const acceptance = acceptances?.find(a => 
        a.agreement_type === type && a.document_version === currentVersion
      );
      
      status[type] = {
        accepted: !!acceptance,
        version: acceptance?.document_version,
        accepted_at: acceptance?.accepted_at,
      };
    }

    // Check license agreement separately (only for licensees)
    const licenseVersion = versions?.find(v => v.agreement_type === 'license')?.current_version;
    const licenseAcceptance = acceptances?.find(a => 
      a.agreement_type === 'license' && a.document_version === licenseVersion
    );
    status['license'] = {
      accepted: !!licenseAcceptance,
      version: licenseAcceptance?.document_version,
      accepted_at: licenseAcceptance?.accepted_at,
    };

    const allRequiredAccepted = required.every(type => status[type].accepted);

    return NextResponse.json({
      user_id: user.id,
      all_required_accepted: allRequiredAccepted,
      agreements: status,
    });

  } catch (error) {
    logger.error('Agreement status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/legal/accept', _GET);
export const POST = withApiAudit('/api/legal/accept', _POST);
