import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export type ProgramHolderWorkspace = {
  mode: 'admin' | 'holder';
  holder: any | null;
  profile: any | null;
  programs: any[];
  enrollments: any[];
  upcomingEnrollments: any[];
  applicants: any[];
  hours: any[];
  documents: any[];
  reports: any[];
  courseAssignments: any[];
  payoutProfile: any | null;
  payoutSchedules: any[];
  notificationPreferences: any | null;
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
      hours: [],
      documents: [],
      reports: [],
      courseAssignments: [],
      payoutProfile: null,
      payoutSchedules: [],
      notificationPreferences: null,
    };
  }

  const { db, holderId, programIds, profile } = ctx;
  const [
    holderRes,
    programsRes,
    enrollmentsRes,
    upcomingRes,
    applicantsRes,
    hoursRes,
    documentsRes,
    reportsRes,
    coursesRes,
    payoutRes,
    schedulesRes,
    notificationRes,
  ] = await Promise.all([
    db
      .from('program_holders')
      .select(
        'id,status,mou_signed,mou_status,approved_at,payout_status,organization_name,name,is_using_internal_lms,hvac_license_url',
      )
      .eq('id', holderId)
      .maybeSingle(),
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
        'id,user_id,full_name,email,status,enrollment_state,program_id,program_slug,enrolled_at,progress_percent,at_risk,next_required_action,training_start_date,training_end_date,total_hours_completed,lms_completed,practical_skills_verified',
      )
      .eq('program_holder_id', holderId)
      .in('status', ['active', 'enrolled', 'completed', 'graduated'])
      .order('enrolled_at', { ascending: false }),
    db
      .from('program_enrollments')
      .select(
        'id,user_id,full_name,email,phone,status,enrollment_state,program_id,program_slug,training_start_date,training_end_date,student_start_date,expected_end_date,start_date',
      )
      .eq('program_holder_id', holderId)
      .in('status', ['pending', 'approved', 'scheduled', 'ready', 'funded'])
      .order('training_start_date', { ascending: true, nullsFirst: false }),
    db
      .from('program_holder_students')
      .select('id,applicant_name,applicant_email,applicant_phone,status,application_status,program_id,created_at,label,call_notes,call_date,call_outcome')
      .eq('program_holder_id', holderId)
      .in('status', ['applied', 'pending'])
      .order('created_at', { ascending: false }),
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
        'stripe_account_id,external_account_last4,bank_name,account_type,payouts_enabled,charges_enabled,transfers_enabled,verification_status,quickbooks_sync_status,last_stripe_sync_at',
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
      .select('email_course_updates,sms_urgent,sms_phone')
      .eq('user_id', profile.id)
      .maybeSingle(),
  ]);

  return {
    mode: 'holder',
    holder: holderRes.data ?? null,
    profile,
    programs: programsRes.data ?? [],
    enrollments: enrollmentsRes.data ?? [],
    upcomingEnrollments: upcomingRes.data ?? [],
    applicants: applicantsRes.data ?? [],
    hours: hoursRes.data ?? [],
    documents: documentsRes.data ?? [],
    reports: reportsRes.data ?? [],
    courseAssignments: coursesRes.data ?? [],
    payoutProfile: payoutRes.data ?? null,
    payoutSchedules: schedulesRes.data ?? [],
    notificationPreferences: notificationRes.data ?? null,
  };
}

export function programTitle(programs: any[], programId?: string | null, slug?: string | null) {
  const program = programs.find((item) => item.id === programId || (slug && item.slug === slug));
  return program?.title || program?.name || slug || 'Assigned program';
}
