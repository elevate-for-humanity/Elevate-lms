import { createClient } from '@/lib/supabase/server';

import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/partner-launch/[enrollmentId]/route.ts
import { NextResponse } from 'next/server';
import { getPartnerClient, PartnerType } from '@/lib/partners';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';



interface Params {
  params: Promise<{ enrollmentId: string }>;
}

async function _GET(_req: Request, { params }: Params) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { enrollmentId } = await params;

  const { data: enrollment, error } = await supabase
    .from('partner_lms_enrollments')
    .select(
      `
      *,
      partner_lms_providers ( provider_type )
    `
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  if (error || !enrollment) {
    return new NextResponse('Enrollment not found', { status: 404 });
  }

  const partnerType = enrollment.partner_lms_providers
    .provider_type as PartnerType;
  const client = getPartnerClient(partnerType);

  const launchUrl = await client.getSsoLaunchUrl({
    accountExternalId: enrollment.metadata?.external_account_id,
    externalEnrollmentId: enrollment.external_enrollment_id,
    returnTo: `${process.env.NEXT_PUBLIC_APP_URL}/learner/dashboard`,
  });

  return NextResponse.redirect(launchUrl);
}
export const GET = withApiAudit('/api/partner-launch/[enrollmentId]', _GET);
