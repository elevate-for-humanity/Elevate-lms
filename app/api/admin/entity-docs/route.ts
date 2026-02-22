import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get all documents for a user/entity and their verification status.
 * Used by the admin verification drawer to show entity-level doc checklist.
 */
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const category = searchParams.get('category');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get all documents for this user
  const docTypes = getDocTypesForCategory(category || 'all');
  
  let query = db
    .from('documents')
    .select('*')
    .eq('user_id', userId);

  if (docTypes.length > 0) {
    query = query.in('document_type', docTypes);
  }

  const { data: documents, error: docsError } = await query;

  if (docsError) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  // Get entity status (intake, agreement, etc.)
  const entityStatus = await getEntityStatus(supabase, userId, category);

  return NextResponse.json({
    documents: documents || [],
    entityStatus,
  });
}

function getDocTypesForCategory(category: string): string[] {
  switch (category) {
    case 'apprentice':
      return ['photo_id'];
    case 'host_shop':
      return ['shop_license', 'barber_license'];
    case 'transfer':
      return ['school_transcript', 'certificate', 'out_of_state_license', 'employment_verification'];
    case 'ce':
      return ['ce_certificate'];
    default:
      return [];
  }
}

async function getEntityStatus(
  supabase: any,
  userId: string,
  category: string | null
): Promise<{
  intake_complete: boolean;
  agreement_accepted: boolean;
  docs_verified: boolean;
  ready: boolean;
} | null> {
  try {
    // Check profile for basic status
    const { data: profile } = await db
      .from('profiles')
      .select('enrollment_status, agreement_signed_at')
      .eq('id', userId)
      .single();

    // Check documents verification status
    const docTypes = getDocTypesForCategory(category || 'all');
    let docsVerified = false;

    if (docTypes.length > 0) {
      const { data: docs } = await db
        .from('documents')
        .select('document_type, status, verified')
        .eq('user_id', userId)
        .in('document_type', docTypes);

      // For apprentice: photo_id must be verified
      // For host_shop: both shop_license AND barber_license must be verified
      // For transfer: at least one must be verified (OR logic)
      // For ce: ce_certificate must be verified
      
      if (category === 'apprentice') {
        docsVerified = docs?.some(
          (d: any) => d.document_type === 'photo_id' && (d.verified || d.status === 'verified')
        ) || false;
      } else if (category === 'host_shop') {
        const shopLicenseVerified = docs?.some(
          (d: any) => d.document_type === 'shop_license' && (d.verified || d.status === 'verified')
        );
        const barberLicenseVerified = docs?.some(
          (d: any) => d.document_type === 'barber_license' && (d.verified || d.status === 'verified')
        );
        docsVerified = shopLicenseVerified && barberLicenseVerified;
      } else if (category === 'transfer') {
        // At least one transfer doc verified
        docsVerified = docs?.some(
          (d: any) => (d.verified || d.status === 'verified')
        ) || false;
      } else if (category === 'ce') {
        docsVerified = docs?.some(
          (d: any) => d.document_type === 'ce_certificate' && (d.verified || d.status === 'verified')
        ) || false;
      }
    }

    // Check for enrollment/application record
    const { data: enrollment } = await db
      .from('enrollments')
      .select('status, agreement_signed')
      .eq('user_id', userId)
      .single();

    const intakeComplete = !!profile && (
      profile.enrollment_status === 'pending' || 
      profile.enrollment_status === 'active' ||
      !!enrollment
    );

    const agreementAccepted = !!(
      profile?.agreement_signed_at || 
      enrollment?.agreement_signed
    );

    return {
      intake_complete: intakeComplete,
      agreement_accepted: agreementAccepted,
      docs_verified: docsVerified,
      ready: intakeComplete && agreementAccepted && docsVerified,
    };
  } catch (error) {
    logger.error('Failed to get entity status:', error);
    return null;
  }
}
