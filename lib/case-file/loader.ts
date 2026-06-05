/**
 * Case File Loader
 *
 * Aggregates all participant data into a unified case file view.
 */

import { createClient } from '@/lib/supabase/server';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';
import { ParticipantCaseFile, CaseFileSummary, generateCaseNumber } from './types';

/**
 * Load a complete participant case file
 */
export async function loadCaseFile(participantId: string): Promise<ParticipantCaseFile | null> {
  await requireStaffPortalAccess();
  const supabase = await createClient();

  // Load profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', participantId)
    .eq('role', 'student')
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  // Load applications
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', participantId)
    .order('created_at', { ascending: false });

  // Load enrollments
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('*')
    .eq('student_id', participantId)
    .order('created_at', { ascending: false });

  // Load documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', participantId)
    .order('created_at', { ascending: false });

  // Load certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', participantId)
    .order('issued_at', { ascending: false });

  // Load activity/audit log
  const { data: activityLog } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', participantId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate progress
  const { data: courseProgress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', participantId);

  const totalCourses = courseProgress?.length || 0;
  const completedCourses = courseProgress?.filter((c) => c.completed_at)?.length || 0;

  // Get latest activity timestamp
  const timestamps = [
    profile.updated_at,
    applications?.[0]?.created_at,
    enrollments?.[0]?.updated_at,
    documents?.[0]?.created_at,
    activityLog?.[0]?.created_at,
  ].filter(Boolean);

  const lastActivityAt =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps.map((t) => new Date(t).getTime()))).toISOString()
      : profile.created_at;

  // Build case file
  const caseFile: ParticipantCaseFile = {
    id: participantId,
    caseNumber: generateCaseNumber(participantId, new Date(profile.created_at)),
    createdAt: profile.created_at,
    lastActivityAt,

    profile: {
      id: profile.id,
      fullName:
        profile.full_name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        'Unknown',
      email: profile.email || '',
      phone: profile.phone,
      dateOfBirth: profile.date_of_birth,
      address: profile.address
        ? {
            street: profile.address.street,
            city: profile.address.city,
            state: profile.address.state,
            zip: profile.address.zip,
            county: profile.address.county,
          }
        : undefined,
      demographics: {
        veteran: profile.is_veteran,
        justiceInvolved: profile.is_justice_involved,
        disability: profile.has_disability,
        publicAssistance: profile.receives_public_assistance,
      },
    },

    eligibility: {
      status: applications?.[0]?.eligibility_status || 'pending',
      fundingSource: enrollments?.[0]?.funding_source,
      verifiedAt: applications?.[0]?.eligibility_verified_at,
      verifiedBy: applications?.[0]?.eligibility_verified_by,
      workOneId: profile.workone_id,
      notes: applications?.[0]?.advisor_notes,
    },

    applications: (applications || []).map((app) => ({
      id: app.id,
      programSlug: app.program_slug || app.program_id,
      programName: app.program_name || app.program_slug || 'Unknown Program',
      status: app.status,
      submittedAt: app.created_at,
      reviewedAt: app.reviewed_at,
      reviewedBy: app.reviewed_by,
    })),

    enrollments: (enrollments || []).map((enr) => ({
      id: enr.id,
      programSlug: enr.program_slug || '',
      programName: enr.program_slug || 'Unknown Program',
      status: enr.status,
      enrolledAt: enr.enrolled_at || enr.created_at,
      startedAt: enr.started_at,
      completedAt: enr.completed_at,
      paymentStatus: enr.payment_status,
      paymentOption: enr.payment_option,
      amountPaid: enr.amount_paid,
    })),

    documents: (documents || []).map((doc) => ({
      id: doc.id,
      type: doc.document_type || doc.type || 'other',
      name: doc.name || doc.file_name || 'Document',
      status: doc.status || 'pending',
      uploadedAt: doc.created_at,
      reviewedAt: doc.reviewed_at,
      reviewedBy: doc.reviewed_by,
    })),

    progress: {
      totalCourses,
      completedCourses,
      totalHours: 0, // Would need hour tracking data
      completedHours: 0,
      attendanceRate: undefined,
      lastActivityAt: courseProgress?.[0]?.updated_at,
    },

    credentials: (certificates || []).map((cert) => ({
      id: cert.id,
      type: cert.type || 'certificate',
      name: cert.program_name || cert.title || 'Certificate',
      issuedAt: cert.issued_at || cert.created_at,
      expiresAt: cert.expires_at,
      verificationUrl: cert.verification_url || `/verify/${cert.id}`,
      verified: true,
    })),

    employment: {
      status: profile.employment_status || 'seeking',
      employer: profile.current_employer,
      position: profile.current_position,
      placedAt: profile.placed_at,
      wageRange: profile.wage_range,
    },

    activityLog: (activityLog || []).map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description || log.action,
      performedBy: log.performed_by || 'System',
      performedAt: log.created_at,
      metadata: log.metadata,
    })),

    caseStatus: {
      status: enrollments?.some((e) => e.status === 'active')
        ? 'active'
        : enrollments?.some((e) => e.status === 'completed')
          ? 'closed'
          : 'active',
      assignedAdvisor: applications?.[0]?.advisor_assigned,
      nextAction: applications?.[0]?.next_step,
      nextActionDueDate: applications?.[0]?.next_step_due_date,
    },
  };

  return caseFile;
}

/**
 * Load case file summaries for list view
 */
export async function loadCaseFileSummaries(
  options: {
    status?: 'active' | 'closed' | 'archived';
    limit?: number;
    offset?: number;
  } = {},
): Promise<CaseFileSummary[]> {
  await requireStaffPortalAccess();
  const supabase = await createClient();
  const { limit = 50, offset = 0 } = options;

  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      first_name,
      last_name,
      email,
      created_at,
      updated_at
    `,
    )
    .eq('role', 'student')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!profiles) return [];

  // Get enrollments for these profiles
  const profileIds = profiles.map((p) => p.id);
  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('student_id, program_slug, status, updated_at')
    .in('student_id', profileIds)
    .order('updated_at', { ascending: false });

  // Get applications for eligibility status
  const { data: applications } = await supabase
    .from('applications')
    .select('user_id, eligibility_status, updated_at')
    .in('user_id', profileIds)
    .order('updated_at', { ascending: false });

  // Build summaries
  return profiles.map((profile) => {
    const enrollment = enrollments?.find((e) => e.student_id === profile.id);
    const application = applications?.find((a) => a.user_id === profile.id);

    return {
      id: profile.id,
      caseNumber: generateCaseNumber(profile.id, new Date(profile.created_at)),
      participantName:
        profile.full_name ||
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
        'Unknown',
      email: profile.email || '',
      currentProgram: enrollment?.program_slug,
      enrollmentStatus: enrollment?.status,
      eligibilityStatus: application?.eligibility_status || 'pending',
      lastActivityAt: profile.updated_at || profile.created_at,
      caseStatus:
        enrollment?.status === 'active'
          ? 'active'
          : enrollment?.status === 'completed'
            ? 'closed'
            : 'active',
    };
  });
}
