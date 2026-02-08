import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { getOrgSubscription, getLicenseStatus } from '@/lib/billing';

/**
 * Get organization subscription and license status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await getOrgContext(supabase, user.id);

    // Only org_admin and super_admin can view billing
    if (!['org_admin', 'super_admin'].includes(ctx.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const subscription = await getOrgSubscription(
      supabase,
      ctx.organization_id
    );
    const licenseStatus = getLicenseStatus(subscription);

    return NextResponse.json({
      subscription,
      license_status: licenseStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to fetch subscription',
      },
      { status: 500 }
    );
  }
}
