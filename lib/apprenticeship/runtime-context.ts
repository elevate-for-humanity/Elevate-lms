import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveRegisteredProgramContract } from '@/lib/apprenticeship/registered-program-contract';

export type ApprenticeshipRuntimeContext = {
  enrollment: Record<string, any>;
  studentId: string;
  programSlug: string;
  placement: Record<string, any> | null;
  shop: Record<string, any> | null;
  partner: Record<string, any> | null;
  supervisor: Record<string, any> | null;
  contract: Awaited<ReturnType<typeof resolveRegisteredProgramContract>>;
};

const ACTIVE_ENROLLMENT_STATES = ['active', 'enrolled', 'in_progress', 'confirmed'];

export async function resolveApprenticeshipRuntimeContext(
  db: SupabaseClient,
  input: {
    enrollmentId?: string | null;
    userId?: string | null;
    programSlug?: string | null;
    requireRegisteredStandard?: boolean;
  },
): Promise<ApprenticeshipRuntimeContext | null> {
  let enrollmentQuery = db
    .from('program_enrollments')
    .select(
      'id,user_id,student_id,program_id,program_slug,status,enrollment_state,host_shop_id,supervisor_id,rapids_status,rapids_id,course_id,orientation_completed_at,documents_submitted_at,access_granted_at,payment_status,funding_status,transfer_hours,transfer_hours_verified,transfer_hours_verified_at,transfer_hours_source,created_at',
    );

  if (input.enrollmentId) enrollmentQuery = enrollmentQuery.eq('id', input.enrollmentId);
  if (input.userId) {
    enrollmentQuery = enrollmentQuery.or(`user_id.eq.${input.userId},student_id.eq.${input.userId}`);
  }
  if (input.programSlug) enrollmentQuery = enrollmentQuery.eq('program_slug', input.programSlug);
  if (!input.enrollmentId) {
    enrollmentQuery = enrollmentQuery.in('status', ACTIVE_ENROLLMENT_STATES).order('created_at', { ascending: false }).limit(1);
  }

  const { data: enrollment, error: enrollmentError } = await enrollmentQuery.maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) return null;

  const studentId = enrollment.user_id || enrollment.student_id;
  const programSlug = enrollment.program_slug;
  if (!studentId || !programSlug) {
    throw new Error(`APPRENTICESHIP_ENROLLMENT_IDENTITY_INCOMPLETE:${enrollment.id}`);
  }

  const { data: placement, error: placementError } = await db
    .from('apprentice_placements')
    .select('id,student_id,program_slug,shop_id,supervisor_user_id,start_date,end_date,status,tenant_id')
    .eq('student_id', studentId)
    .eq('program_slug', programSlug)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (placementError) throw placementError;

  let shop: Record<string, any> | null = null;
  let partner: Record<string, any> | null = null;
  if (placement?.shop_id) {
    const { data: shopRow, error: shopError } = await db
      .from('shops')
      .select('id,name,address1,address2,city,state,zip,active,partner_id,latitude,longitude,owner_id')
      .eq('id', placement.shop_id)
      .maybeSingle();
    if (shopError) throw shopError;
    shop = shopRow || null;

    if (shop?.partner_id) {
      const { data: partnerRow, error: partnerError } = await db
        .from('partners')
        .select('id,name,dba,legal_name,shop_name,status,is_active,approval_status,verification_status,documents_verified,mou_signed,onboarding_completed,rapids_employer_number,rapids_registration_status,rapids_sponsor_registration_number,programs')
        .eq('id', shop.partner_id)
        .maybeSingle();
      if (partnerError) throw partnerError;
      partner = partnerRow || null;
    }
  }

  let supervisor: Record<string, any> | null = null;
  if (placement?.supervisor_user_id) {
    const { data: supervisorProfile, error: supervisorError } = await db
      .from('profiles')
      .select('id,full_name,email')
      .eq('id', placement.supervisor_user_id)
      .maybeSingle();
    if (supervisorError) throw supervisorError;
    supervisor = supervisorProfile || null;
  }

  const contract = await resolveRegisteredProgramContract(db, {
    programSlug,
    partnerId: partner?.id || null,
    enrollmentId: enrollment.id,
  });

  if (input.requireRegisteredStandard !== false && !contract) {
    throw new Error(`REGISTERED_PROGRAM_CONTRACT_MISSING:${programSlug}`);
  }

  return {
    enrollment,
    studentId,
    programSlug,
    placement: placement || null,
    shop,
    partner,
    supervisor,
    contract,
  };
}

export function assertOperationalPlacement(context: ApprenticeshipRuntimeContext) {
  if (!context.contract) throw new Error(`REGISTERED_PROGRAM_CONTRACT_MISSING:${context.programSlug}`);
  if (!context.placement) throw new Error(`ACTIVE_APPRENTICESHIP_PLACEMENT_REQUIRED:${context.enrollment.id}`);
  if (!context.shop || context.shop.active === false) throw new Error(`ACTIVE_HOST_SHOP_REQUIRED:${context.enrollment.id}`);
  if (!context.partner) throw new Error(`CANONICAL_HOST_SHOP_PARTNER_REQUIRED:${context.enrollment.id}`);
  if (context.partner.status !== 'active' || context.partner.is_active === false) {
    throw new Error(`ACTIVE_HOST_SHOP_PARTNER_REQUIRED:${context.partner.id}`);
  }
  if (context.partner.approval_status !== 'approved' || context.partner.verification_status !== 'verified') {
    throw new Error(`VERIFIED_HOST_SHOP_PARTNER_REQUIRED:${context.partner.id}`);
  }
  if (!context.partner.mou_signed || !context.partner.onboarding_completed) {
    throw new Error(`HOST_SHOP_ONBOARDING_INCOMPLETE:${context.partner.id}`);
  }
  if (!context.placement.supervisor_user_id || !context.supervisor) {
    throw new Error(`ASSIGNED_SUPERVISOR_REQUIRED:${context.placement.id}`);
  }
  return context;
}
