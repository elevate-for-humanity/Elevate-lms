import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export type ProgramHolderWorkspace = {
  mode: 'admin' | 'holder';
  holder: any | null;
  profile: any | null;
  programs: any[];
  enrollments: any[];
  upcomingEnrollments: any[];
  applicants: any[];
  convertedStudents: any[];
  hours: any[];
  documents: any[];
  reports: any[];
  courseAssignments: any[];
  payoutProfile: any | null;
  payoutSchedules: any[];
  notificationPreferences: any | null;
  acknowledgements: any[];
  imageReleaseConsent: any | null;
  contactAccessGranted: boolean;
  requiresEnchantedHeartsTerms: boolean;
  phoneLine: {
    id: string;
    e164: string;
    label: string;
    extension: string | null;
    status: string;
  } | null;
};

/** Canonical, holder-scoped data contract shared by every Program Holder page. */
export async function getProgramHolderWorkspace(): Promise<ProgramHolderWorkspace> {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') {
    return {
      mode: 'admin',
      holder: null,
      profile: null,
      programs: [],
      enrollments: [],
      upcomingEnrollments: [],
      applicants: [],
      convertedStudents: [],
      hours: [],
      documents: [],
      reports: [],
      courseAssignments: [],
      payoutProfile: null,
      payoutSchedules: [],
      notificationPreferences: null,
      acknowledgements: [],
      imageReleaseConsent: null,
      contactAccessGranted: false,
      requiresEnchantedHeartsTerms: false,
      phoneLine: null,
    };
  }

  const { db, holderId, programIds, profile } = ctx;
  const [holderRes, acknowledgementsRes, imageReleaseRes] = await Promise.all([
    db
      .from('program_holders')
      .select(
        'id,status,mou_signed,mou_status,mou_type,approved_at,payout_status,organization_name,name,is_using_internal_lms,hvac_license_url,features',
      )
      .eq('id', holderId)
      .maybeSingle(),
    db
      .from('program_holder_acknowledgements')
      .select('document_type,acknowledged_at')
      .eq('user_id', profile.id),
    db
      .from('image_release_consents')
      .select('id,signed_at,granted,revoked_at')
      .eq('user_id', profile.id)
      .eq('granted', true)
      .is('revoked_at', null)
      .maybeSingle(),
  ]);
  const acknowledgements = acknowledgementsRes.data ?? [];
  const holderName = `${holderRes.data?.organization_name || ''} ${holderRes.data?.name || ''}`;
  const requiresEnchantedHeartsTerms = /enchanted hearts/i.test(holderName);
  const signedTypes = new Set(acknowledgements.map((item: any) => item.document_type));
  const contactAccessGranted =
    signedTypes.has('non_compete') &&
    (!requiresEnchantedHeartsTerms || signedTypes.has('enchanted_hearts_referral_terms'));
  // PII is excluded from the database projection until the required agreements are signed.
  // This is an authorization boundary, not a presentational hide/show control.
  const enrollmentContactColumns = contactAccessGranted ? ',email,phone' : '';
  const applicantContactColumns = contactAccessGranted ? ',applicant_email,applicant_phone' : '';
  const [
    programsRes,
    enrollmentsRes,
    upcomingRes,
    applicantsRes,
    convertedStudentsRes,
    hoursRes,
    documentsRes,
    reportsRes,
    coursesRes,
    payoutRes,
    schedulesRes,
    notificationRes,
    phoneLineRes,
    extensionRes,
  ] = await Promise.all([
    programIds.length
      ? db
          .from('programs')
          .select('id,name,title,slug,status,is_active,credential_name,total_hours')
          .in('id', programIds)
          .order('title')
      : Promise.resolve({ data: [] }),
    db
      .from('program_enrollments')
      .select(
        `id,user_id,full_name,status,enrollment_state,program_id,program_slug,enrolled_at,progress_percent,at_risk,next_required_action,training_start_date,training_end_date,total_hours_completed,lms_completed,practical_skills_verified,funding_verified,voucher_issued_date,voucher_paid_date,payment_status,amount_paid_cents,completed_at,completion_date${enrollmentContactColumns}`,
      )
      .eq('program_holder_id', holderId)
      .in('status', [
        'active',
        'enrolled',
        'in_progress',
        'pending',
        'applied',
        'approved',
        'scheduled',
        'ready',
        'funded',
        'completed',
        'graduated',
      ])
      .order('enrolled_at', { ascending: false }),
    db
      .from('program_enrollments')
      .select(
        `id,user_id,full_name,status,enrollment_state,program_id,program_slug,training_start_date,training_end_date,student_start_date,expected_end_date,start_date${enrollmentContactColumns}`,
      )
      .eq('program_holder_id', holderId)
      .in('status', ['active', 'enrolled', 'pending', 'approved', 'scheduled', 'ready', 'funded'])
      .order('training_start_date', { ascending: true, nullsFirst: false }),
    db
      .from('program_holder_students')
      .select(
        `id,applicant_name,status,application_status,program_id,created_at,label,call_notes,call_date,call_outcome,next_follow_up,work_start_date,work_site${applicantContactColumns}`,
      )
      .eq('program_holder_id', holderId)
      .in('status', ['applied', 'pending'])
      .order('created_at', { ascending: false }),
    db
      .from('program_holder_students')
      .select(
        `id,user_id,applicant_name,status,application_status,program_id,label,call_notes,call_date,call_outcome,work_start_date,completion_date,work_progress,hours_taught,hours_required,work_site,expected_payout_cents,expected_payout_status,updated_at${applicantContactColumns}`,
      )
      .eq('program_holder_id', holderId)
      .in('status', ['active', 'enrolled', 'pending', 'applied', 'approved', 'scheduled', 'ready'])
      .order('updated_at', { ascending: false }),
    db
      .from('hour_entries')
      .select(
        'id,user_id,status,approval_status,hours,hours_claimed,work_date,program_slug,category,notes,created_at',
      )
      .eq('program_holder_id', holderId)
      .order('work_date', { ascending: false })
      .limit(100),
    db
      .from('program_holder_documents')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    db
      .from('program_holder_reports')
      .select('*')
      .eq('program_holder_id', holderId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('program_holder_courses')
      .select(
        'id,program_id,course_id,status,term_name,start_date,end_date,credential_alignment_status',
      )
      .eq('program_holder_id', holderId),
    db
      .from('program_holder_payouts')
      .select(
        'payout_provider,provider_recipient_id,payouts_enabled,transfers_enabled,instant_payouts_enabled,verification_status,quickbooks_sync_status,last_provider_sync_at',
      )
      .eq('user_id', profile.id)
      .maybeSingle(),
    db
      .from('payout_schedules')
      .select(
        'id,enrollment_id,program_id,total_payout_cents,increment_1_cents,increment_2_cents,increment_1_status,increment_2_status,increment_1_release_date,increment_2_release_date,increment_1_paid_at,increment_2_paid_at',
      )
      .eq('program_holder_id', holderId)
      .order('created_at', { ascending: false }),
    db
      .from('notification_preferences')
      .select(
        'email_course_updates,sms_urgent,sms_phone,email_delivery_updates,sms_delivery_updates,paris_orientation_completed_at',
      )
      .eq('user_id', profile.id)
      .maybeSingle(),
    db
      .from('phone_numbers')
      .select('id,e164,label,extension,status')
      .eq('assigned_profile_id', profile.id)
      .neq('status', 'released')
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('communication_extensions')
      .select('extension,workspace:communication_workspaces(phone_system_id)')
      .eq('profile_id', profile.id)
      .eq('enabled', true)
      .limit(1)
      .maybeSingle(),
  ]);

  let phoneLine = phoneLineRes.data ?? null;
  const extension = extensionRes.data?.extension ?? phoneLine?.extension ?? null;
  const workspaceValue = extensionRes.data?.workspace as
    | { phone_system_id?: string | null }
    | { phone_system_id?: string | null }[]
    | null
    | undefined;
  const phoneSystemId = Array.isArray(workspaceValue)
    ? workspaceValue[0]?.phone_system_id
    : workspaceValue?.phone_system_id;
  if (!phoneLine && phoneSystemId) {
    const { data: primaryLine } = await db
      .from('phone_numbers')
      .select('id,e164,label,status')
      .eq('phone_system_id', phoneSystemId)
      .eq('is_primary', true)
      .neq('status', 'released')
      .maybeSingle();
    phoneLine = primaryLine ? { ...primaryLine, extension } : null;
  } else if (phoneLine) {
    phoneLine = { ...phoneLine, extension };
  }

  return {
    mode: 'holder',
    holder: holderRes.data ?? null,
    profile,
    programs: programsRes.data ?? [],
    enrollments: enrollmentsRes.data ?? [],
    upcomingEnrollments: upcomingRes.data ?? [],
    applicants: applicantsRes.data ?? [],
    convertedStudents: (convertedStudentsRes.data ?? []).map((row: any) => ({
      ...row,
      roster_source: 'holder_student',
      full_name: row.applicant_name || 'Student',
      enrollment_state: row.status,
      program_slug: null,
      training_start_date: row.work_start_date,
      training_end_date: row.completion_date,
      total_hours_completed: Number(row.hours_taught || 0),
      progress_percent:
        Number(row.hours_required || 0) > 0
          ? Math.min(
              100,
              Math.round((Number(row.hours_taught || 0) / Number(row.hours_required)) * 100),
            )
          : 0,
      next_required_action:
        row.work_progress && row.work_progress !== 'Not started'
          ? row.work_progress
          : 'Record training progress',
      funding_verified: false,
      voucher_issued_date: null,
      voucher_paid_date: null,
      payment_status: null,
      amount_paid_cents: 0,
    })),
    hours: hoursRes.data ?? [],
    documents: documentsRes.data ?? [],
    reports: reportsRes.data ?? [],
    courseAssignments: coursesRes.data ?? [],
    payoutProfile: payoutRes.data ?? null,
    payoutSchedules: schedulesRes.data ?? [],
    notificationPreferences: notificationRes.data ?? null,
    acknowledgements,
    imageReleaseConsent: imageReleaseRes.data ?? null,
    contactAccessGranted,
    requiresEnchantedHeartsTerms,
    phoneLine,
  };
}

export function programTitle(programs: any[], programId?: string | null, slug?: string | null) {
  const program = programs.find((item) => item.id === programId || (slug && item.slug === slug));
  return program?.title || program?.name || slug || 'Assigned program';
}
