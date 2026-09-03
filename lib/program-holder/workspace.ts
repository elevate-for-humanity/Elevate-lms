import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export type ProgramHolderWorkspace = {
  mode: 'admin' | 'holder';
  holder: any | null;
  programs: any[];
  enrollments: any[];
  applicants: any[];
  hours: any[];
  documents: any[];
  reports: any[];
  courseAssignments: any[];
};

/** Canonical, holder-scoped data contract shared by every Program Holder page. */
export async function getProgramHolderWorkspace(): Promise<ProgramHolderWorkspace> {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin') {
    return { mode: 'admin', holder: null, programs: [], enrollments: [], applicants: [], hours: [], documents: [], reports: [], courseAssignments: [] };
  }

  const { db, holderId, programIds, profile } = ctx;
  const [holderRes, programsRes, enrollmentsRes, applicantsRes, hoursRes, documentsRes, reportsRes, coursesRes] = await Promise.all([
    db.from('program_holders').select('id,status,mou_signed,mou_status,approved_at,payout_status,organization_name,name,is_using_internal_lms,hvac_license_url').eq('id', holderId).maybeSingle(),
    programIds.length
      ? db.from('programs').select('id,name,title,slug,status,is_active,credential_name,duration_hours').in('id', programIds).order('title')
      : Promise.resolve({ data: [] }),
    db.from('program_enrollments').select('id,user_id,full_name,email,status,enrollment_state,program_id,program_slug,enrolled_at,progress_percent,at_risk,next_required_action').eq('program_holder_id', holderId).order('enrolled_at', { ascending: false }),
    db.from('program_holder_students').select('id,applicant_name,applicant_email,status,application_status,program_id,created_at').eq('program_holder_id', holderId).in('status', ['applied', 'pending']).order('created_at', { ascending: false }),
    db.from('hour_entries').select('id,user_id,status,approval_status,hours,hours_claimed,work_date,program_slug').eq('program_holder_id', holderId).order('work_date', { ascending: false }).limit(100),
    db.from('program_holder_documents').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
    db.from('program_holder_reports').select('*').eq('program_holder_id', holderId).order('created_at', { ascending: false }).limit(50),
    db.from('program_holder_courses').select('id,program_id,course_id,status,term_name,start_date,end_date,credential_alignment_status').eq('program_holder_id', holderId),
  ]);

  return {
    mode: 'holder',
    holder: holderRes.data ?? null,
    programs: programsRes.data ?? [],
    enrollments: enrollmentsRes.data ?? [],
    applicants: applicantsRes.data ?? [],
    hours: hoursRes.data ?? [],
    documents: documentsRes.data ?? [],
    reports: reportsRes.data ?? [],
    courseAssignments: coursesRes.data ?? [],
  };
}

export function programTitle(programs: any[], programId?: string | null, slug?: string | null) {
  const program = programs.find((item) => item.id === programId || (slug && item.slug === slug));
  return program?.title || program?.name || slug || 'Assigned program';
}
