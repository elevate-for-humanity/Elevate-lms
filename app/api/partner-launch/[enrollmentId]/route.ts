
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/partner-launch/[enrollmentId]/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPartnerClient, PartnerType } from '@/lib/partners';
import { applyRateLimit } from '@/lib/api/withRateLimit';

function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

interface Params {
  params: Promise<{ enrollmentId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = getSupabaseServerClient();
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
