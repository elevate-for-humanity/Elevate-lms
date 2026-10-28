import { loadHolderExitReports } from './exit-reports';
import { curriculumProgress } from './curriculum-progress';
import { hasRecruitingAssignment } from './recruiting-access';
import { loadApprovedSchoolApplicants } from './school-applicants';
import { after } from 'next/server';
import { ensureProgramHolderQuickBooksContractor } from '@/lib/integrations/quickbooks-program-holder-contractor';
import { logger } from '@/lib/logger';
import { verifiedTrainingForEnrollment } from './verified-hours';
import { hasActiveProgramEnrollment, learnerProgramKey } from './enrollment-identity';
import { holderCredentialStatus, holderTrainingRecord } from './student-training';
import { studentContactProjection } from './contact-privacy';
import { isLearnerRosterProfile } from './roster-eligibility';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { calculateDistanceMiles, geocodeAddress, isGeocodingResult } from '@/lib/geo/geocode';

export type ProgramHolderWorkspace = {
  mode: 'admin' | 'holder';
  holder: any | null;
  profile: any | null;
  programs: any[];
  enrollments: any[];
  schoolApplicants: any[];
  upcomingEnrollments: any[];
  applicants: any[];
  convertedStudents: any[];
  hours: any[];
  documents: any[];
  reports: any[];
  testingReports?: any[];
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

type RegionalLocation = { latitude: number; longitude: number };

const GARY_REGIONAL_CITY_CENTERS: Record<string, RegionalLocation> = {
  gary: { latitude: 41.5934, longitude: -87.3464 },
  hammond: { latitude: 41.5834, longitude: -87.5 },
  merrillville: { latitude: 41.4828, longitude: -87.3328 },
  merrilville: { latitude: 41.4828, longitude: -87.3328 },
  chicago: { latitude: 41.8781, longitude: -87.6298 },
  chesterton: { latitude: 41.6106, longitude: -87.0642 },
  'crown point': { latitude: 41.4169, longitude: -87.3653 },
  dyer: { latitude: 41.4942, longitude: -87.5217 },
  'east chicago': { latitude: 41.6392, longitude: -87.4548 },
  griffith: { latitude: 41.5284, longitude: -87.4237 },
  griff: { latitude: 41.5284, longitude: -87.4237 },
  hebron: { latitude: 41.3186, longitude: -87.2003 },
  highland: { latitude: 41.5536, longitude: -87.4517 },
  hobart: { latitude: 41.5323, longitude: -87.255 },
  'lake station': { latitude: 41.575, longitude: -87.2389 },
  munster: { latitude: 41.5645, longitude: -87.5125 },
  portage: { latitude: 41.5759, longitude: -87.1761 },
  schererville: { latitude: 41.4789, longitude: -87.4548 },
  'st john': { latitude: 41.45, longitude: -87.47 },
  'cedar lake': { latitude: 41.3648, longitude: -87.4411 },
  valparaiso: { latitude: 41.4731, longitude: -87.0611 },
  'michigan city': { latitude: 41.7075, longitude: -86.895 },
  'la porte': { latitude: 41.6111, longitude: -86.7225 },
  'new buffalo': { latitude: 41.7939, longitude: -86.7439 },
  'calumet city': { latitude: 41.6156, longitude: -87.5295 },
  lansing: { latitude: 41.5648, longitude: -87.5389 },
  dolton: { latitude: 41.6389, longitude: -87.6073 },
  harvey: { latitude: 41.61, longitude: -87.6467 },
  homewood: { latitude: 41.5573, longitude: -87.6656 },
  matteson: { latitude: 41.5039, longitude: -87.7131 },
  midlothian: { latitude: 41.6253, longitude: -87.7175 },
  'oak park': { latitude: 41.885, longitude: -87.7845 },
  'tinley park': { latitude: 41.5734, longitude: -87.7845 },
  whiting: { latitude: 41.6798, longitude: -87.4945 },
};

function getGaryRegionalCityCenter(city: unknown): RegionalLocation | null {
  if (typeof city !== 'string') return null;
  const normalized = city.trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
  return GARY_REGIONAL_CITY_CENTERS[normalized] ?? null;
}

/** Canonical, holder-scoped data contract shared by every Program Holder page. */
export async function getProgramHolderWorkspace(): Promise<ProgramHolderWorkspace> {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'holder') {
    const holderId = ctx.holderId;
    after(async () => {
      await ensureProgramHolderQuickBooksContractor(ctx.db, holderId).catch(() => {
        logger.warn('[program-holder] QuickBooks contractor reconciliation pending');
      });
    });
  }
  if (ctx.mode === 'admin') {
    return {
      mode: 'admin',
      holder: null,
      profile: null,
      programs: [],
      enrollments: [],
      schoolApplicants: [],
      upcomingEnrollments: [],
      applicants: [],
      convertedStudents: [],
      hours: [],
      documents: [],
      reports: [],
      testingReports: [],
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
        'id,status,mou_signed,mou_status,mou_type,approved_at,payout_status,organization_name,name,contact_phone,contact_email,is_using_internal_lms,hvac_license_url,features',
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
  const contactProjection = studentContactProjection(
    requiresEnchantedHeartsTerms,
    signedTypes.has('non_compete'),
  );
  const contactAccessGranted = contactProjection.granted;
  const enrollmentContactColumns = contactProjection.enrollment;
  const applicantContactColumns = contactProjection.applicant;
  const applicantNotesColumns = contactProjection.notes;
  const programWideStudentAccess = holderRes.data?.features?.program_wide_student_access === true;
  const recruitingEnabled = hasRecruitingAssignment(holderRes.data?.features);
  const allApplicantAccess = holderRes.data?.features?.all_applicant_access === true;
  const regionalAssignment =
    holderRes.data?.features?.regional_assignment &&
    typeof holderRes.data.features.regional_assignment === 'object'
      ? holderRes.data.features.regional_assignment
      : null;
  const isGaryRegionalCoordinator =
    holderRes.data?.features?.approved_role === 'Gary Regional Site Coordinator' &&
    regionalAssignment?.shared_team_key === 'gary-indiana-regional-team' &&
    regionalAssignment?.all_programs_in_region === true;
  const garyHub = { latitude: 41.5863, longitude: -87.351 };
  const garyRadiusMiles = Number(regionalAssignment?.radius_miles || 40);
  const [
    programsRes,
    regionalApplicantsRes,
    enrollmentsRes,
    upcomingRes,
    applicantsRes,
    convertedStudentsRes,
    hoursRes,
    documentsRes,
    reportsRes,
    coursesRes,
    canonicalCourseLinksRes,
    payoutRes,
    schedulesRes,
    notificationRes,
    phoneLineRes,
    extensionRes,
  ] = await Promise.all([
    programIds.length
      ? db
          .from('programs')
          .select(
            'id,name,title,slug,status,is_active,credential_name,total_hours,tuition,total_cost,price,is_free,funding,funding_tags,funding_eligibility,funding_eligible,wioa_approved,etpl_listed,hero_image_url,image_url,cover_image_url,short_description,description,full_description,what_you_learn,career_outcomes,salary_min,salary_max,estimated_weeks,delivery_method',
          )
          .in('id', programIds)
          .order('title')
      : Promise.resolve({ data: [] }),
    isGaryRegionalCoordinator
      ? db
          .from('applications')
          .select(
            'id,user_id,full_name,first_name,last_name,email,phone,address,city,state,zip,zip_code,program_id,program_slug,program_interest,status,created_at',
          )
          .is('revoked_at', null)
          .in('status', ['submitted', 'under_review', 'pending', 'applied'])
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    programIds.length
      ? db
          .from('program_enrollments')
          .select(
            `id,user_id,student_id,program_holder_id,full_name,status,enrollment_state,program_id,program_slug,enrolled_at,progress_percent,at_risk,next_required_action,training_start_date,training_end_date,total_hours_completed,lms_completed,practical_skills_verified,expected_end_date,completed_at,completion_date${enrollmentContactColumns}`,
          )
          .match(programWideStudentAccess ? {} : { program_holder_id: holderId })
          .in('program_id', programIds)
          .is('revoked_at', null)
          .in('status', ['active', 'enrolled', 'in_progress', 'completed', 'graduated'])
          .order('enrolled_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    programIds.length
      ? db
          .from('program_enrollments')
          .select(
            `id,user_id,student_id,program_holder_id,full_name,status,enrollment_state,program_id,program_slug,training_start_date,training_end_date,student_start_date,expected_end_date,start_date${enrollmentContactColumns}`,
          )
          .match(programWideStudentAccess ? {} : { program_holder_id: holderId })
          .in('program_id', programIds)
          .is('revoked_at', null)
          .in('status', ['active', 'enrolled', 'in_progress', 'funded'])
          .order('training_start_date', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    programIds.length
      ? db
          .from('program_holder_students')
          .select(
            `id,application_id,user_id,student_id,program_holder_id,applicant_name,status,application_status,program_id,created_at,label${applicantNotesColumns},call_date,call_outcome,next_follow_up,work_start_date,work_site${applicantContactColumns}`,
          )
          .eq('program_holder_id', holderId)
          .in('program_id', programIds)
          .in('status', ['applicant', 'applied', 'pending'])
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    programIds.length
      ? db
          .from('program_holder_students')
          .select(
            `id,user_id,student_id,program_holder_id,applicant_name,status,application_status,program_id,label${applicantNotesColumns},call_date,call_outcome,work_start_date,completion_date,work_progress,hours_taught,hours_required,work_site,updated_at${applicantContactColumns}`,
          )
          .eq('program_holder_id', holderId)
          .in('program_id', programIds)
          .eq('status', 'enrolled')
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    db
      .from('hour_entries')
      .select(
        'id,user_id,status,approval_status,hours,hours_claimed,accepted_hours,progress_entry_id,work_date,program_slug,category,notes,created_at',
      )
      .eq('program_holder_id', holderId)
      .order('work_date', { ascending: false })
      .limit(5000),
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
        'id,program_id,course_id,status,term_name,start_date,end_date,credential_alignment_status,custom_syllabus_path,custom_syllabus_filename,custom_syllabus_uploaded_at',
      )
      .eq('program_holder_id', holderId),
    programIds.length
      ? db.from('program_courses').select('id,program_id,course_id').in('program_id', programIds)
      : Promise.resolve({ data: [] }),
    db
      .from('program_holder_payouts')
      .select(
        'payout_provider,provider_recipient_id,payouts_enabled,transfers_enabled,instant_payouts_enabled,verification_status,quickbooks_sync_status,last_provider_sync_at',
      )
      .eq('user_id', profile.id)
      .maybeSingle(),
    // Student funding and reimbursement records are administrator-only.
    Promise.resolve({ data: [] }),
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

  // Surface database failures instead of showing an apparently empty dashboard.
  for (const [name, result] of Object.entries({
    holder: holderRes,
    acknowledgements: acknowledgementsRes,
    imageRelease: imageReleaseRes,
    programs: programsRes,
    regionalApplicants: regionalApplicantsRes,
    enrollments: enrollmentsRes,
    upcoming: upcomingRes,
    applicants: applicantsRes,
    convertedStudents: convertedStudentsRes,
    hours: hoursRes,
    documents: documentsRes,
    reports: reportsRes,
    courses: coursesRes,
    canonicalCourseLinks: canonicalCourseLinksRes,
    payout: payoutRes,
    schedules: schedulesRes,
    notifications: notificationRes,
    phoneLine: phoneLineRes,
    extension: extensionRes,
  })) {
    const error = (result as { error?: { message: string } }).error;
    if (error) throw new Error(`Program Holder ${name} could not load: ${error.message}`);
  }

  // Holder-specific course rows override the canonical program/course catalog.
  const canonicalCourseIds = [
    ...new Set(
      [...(canonicalCourseLinksRes.data ?? []), ...(coursesRes.data ?? [])]
        .map((row: any) => row.course_id)
        .filter(Boolean),
    ),
  ];
  const [trainingCoursesRes, authoredCoursesRes] = canonicalCourseIds.length
    ? await Promise.all([
        db
          .from('training_courses')
          .select('id,title,status,is_published')
          .in('id', canonicalCourseIds),
        db
          .from('courses')
          .select(
            'id,title,status,is_active,generation_status,generation_progress,generation_paused,review_status,updated_at',
          )
          .in('id', canonicalCourseIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (trainingCoursesRes.error || authoredCoursesRes.error)
    throw new Error('Program Holder course catalog could not load.');
  const courseMetadata = new Map(
    [...(trainingCoursesRes.data ?? []), ...(authoredCoursesRes.data ?? [])].map((row: any) => [
      row.id,
      row,
    ]),
  );
  const buildMetadata = new Map((authoredCoursesRes.data ?? []).map((row: any) => [row.id, row]));
  const deliveryAssignments = (coursesRes.data ?? []).map((row: any) => ({
    ...row,
    build: curriculumProgress(buildMetadata.get(row.course_id)),
  }));
  for (const link of canonicalCourseLinksRes.data ?? []) {
    const course: any = courseMetadata.get(link.course_id);
    if (
      !course ||
      deliveryAssignments.some(
        (row) => row.program_id === link.program_id && row.course_id === link.course_id,
      )
    )
      continue;
    deliveryAssignments.push({
      ...link,
      title: course.title,
      status: course.status,
      source: 'canonical_program',
      published: course.is_published === true || course.status === 'published',
      build: curriculumProgress(buildMetadata.get(link.course_id)),
    });
  }
  const rosterUserIds: string[] = Array.from(
    new Set(
      [
        ...(enrollmentsRes.data ?? []),
        ...(upcomingRes.data ?? []),
        ...(convertedStudentsRes.data ?? []),
      ]
        .map((row: any) => row.user_id)
        .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
    ),
  );
  const progressEntriesRes =
    rosterUserIds.length && programIds.length
      ? await db
          .from('progress_entries')
          .select(
            'id,apprentice_id,program_id,hour_entry_id,hours_worked,work_date,clock_in_at,clock_out_at,status',
          )
          .in('apprentice_id', rosterUserIds)
          .in('program_id', programIds)
          .eq('status', 'verified')
          .order('work_date', { ascending: false })
          .limit(5000)
      : { data: [], error: null };
  if (progressEntriesRes.error)
    throw new Error('Program Holder verified training hours could not load.');
  const { data: rosterProfiles, error: rosterProfilesError } = rosterUserIds.length
    ? await db.from('profiles').select('id,role,email,phone,full_name').in('id', rosterUserIds)
    : { data: [], error: null };
  if (rosterProfilesError)
    throw new Error(
      `Program Holder roster profiles could not load: ${rosterProfilesError.message}`,
    );
  const { data: credentialUploads, error: credentialError } =
    rosterUserIds.length && programIds.length
      ? await db
          .from('student_credential_uploads')
          .select('user_id,program_id,verification_status,credential_earned_date,verified_at')
          .in('user_id', rosterUserIds)
          .in('program_id', programIds)
      : { data: [], error: null };
  if (credentialError) throw new Error('Program Holder certification status could not load.');
  const emailByUserId = new Map<string, string>(
    (rosterProfiles ?? [])
      .filter((row) => typeof row.email === 'string' && row.email.trim())
      .map((row) => [row.id, String(row.email).trim()]),
  );
  const phoneByUserId = new Map<string, string>(
    (rosterProfiles ?? [])
      .filter((row) => typeof row.phone === 'string' && row.phone.trim())
      .map((row) => [row.id, String(row.phone).trim()]),
  );
  const trainingRecord = (row: any) =>
    holderTrainingRecord({
      ...row,
      ...(contactAccessGranted
        ? {
            email: row.email || emailByUserId.get(row.user_id || row.student_id),
            phone: row.phone || phoneByUserId.get(row.user_id || row.student_id),
          }
        : {}),
      ...holderCredentialStatus(row, credentialUploads ?? []),
    });
  const eligibleRosterUserIds = new Set(
    (rosterProfiles ?? []).filter(isLearnerRosterProfile).map((row: any) => row.id),
  );
  const nameByUserId = new Map<string, string>(
    (rosterProfiles ?? [])
      .filter((row: any) => typeof row.full_name === 'string' && row.full_name.trim())
      .map((row: any) => [row.id, row.full_name.trim()]),
  );
  const enrolledRoster = (enrollmentsRes.data ?? [])
    .filter((row: any) => !row.user_id || eligibleRosterUserIds.has(row.user_id))
    .map((row: any) => {
      const verified = verifiedTrainingForEnrollment(
        row,
        hoursRes.data ?? [],
        progressEntriesRes.data ?? [],
      );
      return {
        ...row,
        full_name: row.full_name?.trim() || nameByUserId.get(row.user_id) || 'Student',
        total_hours_completed: Math.max(Number(row.total_hours_completed || 0), verified.total),
        training_start_date: row.training_start_date || verified.firstDate || null,
      };
    });
  const upcomingRoster = (upcomingRes.data ?? []).filter(
    (row: any) => !row.user_id || eligibleRosterUserIds.has(row.user_id),
  );
  const convertedRoster = (convertedStudentsRes.data ?? []).filter(
    (row: any) => !row.user_id || eligibleRosterUserIds.has(row.user_id),
  );

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

  const holderApplicantRows = (applicantsRes.data ?? []).filter(
    (row: any) => !hasActiveProgramEnrollment(row, enrolledRoster),
  );
  const distanceCheckedRegionalApplicants = isGaryRegionalCoordinator
    ? (
        await Promise.all(
          (regionalApplicantsRes.data ?? []).map(async (row: any) => {
            const address = [row.address, row.city, row.state || 'IN', row.zip_code || row.zip]
              .filter(Boolean)
              .join(', ');
            if (!address) return null;
            const cityCenter = getGaryRegionalCityCenter(row.city);
            const geocodedLocation = cityCenter ? null : await geocodeAddress(address);
            const location =
              cityCenter || (isGeocodingResult(geocodedLocation) ? geocodedLocation : null);
            if (!location) return null;
            const distanceMiles = calculateDistanceMiles(
              garyHub.latitude,
              garyHub.longitude,
              location.latitude,
              location.longitude,
            );
            return distanceMiles <= garyRadiusMiles ? { ...row, distanceMiles } : null;
          }),
        )
      ).filter(Boolean)
    : [];
  const regionalOwnership = distanceCheckedRegionalApplicants.length
    ? await db
        .from('program_holder_students')
        .select('application_id,program_holder_id,program_holders(status,features)')
        .in(
          'application_id',
          distanceCheckedRegionalApplicants.map((row: any) => row.id),
        )
    : { data: [], error: null };
  if (regionalOwnership.error)
    throw new Error('Regional applicant ownership could not be verified.');
  const locallyControlledApplicationIds = new Set(
    (regionalOwnership.data ?? [])
      .filter((row: any) => {
        const holder = Array.isArray(row.program_holders)
          ? row.program_holders[0]
          : row.program_holders;
        return (
          row.program_holder_id !== holderId &&
          ['active', 'approved', 'approved_pending_mou'].includes(holder?.status) &&
          holder?.features?.regional_assignment?.shared_team_key !==
            regionalAssignment?.shared_team_key
        );
      })
      .map((row: any) => row.application_id),
  );
  const regionalApplicantRows = isGaryRegionalCoordinator
    ? distanceCheckedRegionalApplicants
        .filter((row: any) => !locallyControlledApplicationIds.has(row.id))
        .map((row: any) => ({
          ...holderApplicantRows.find((assigned: any) => assigned.application_id === row.id),
          id:
            holderApplicantRows.find((assigned: any) => assigned.application_id === row.id)?.id ||
            row.id,
          regional_application_id: row.id,
          application_id: row.id,
          user_id: row.user_id,
          enrollment_id: null,
          applicant_name:
            row.full_name ||
            [row.first_name, row.last_name].filter(Boolean).join(' ') ||
            'Applicant',
          applicant_email: contactAccessGranted ? row.email : undefined,
          applicant_phone: contactAccessGranted ? row.phone : undefined,
          status: 'applied',
          application_status: row.status,
          program_id: row.program_id,
          program_slug: row.program_slug || row.program_interest,
          created_at: row.created_at,
          label: `Gary regional applicant · ${row.distanceMiles.toFixed(1)} mi`,
          call_notes:
            holderApplicantRows.find((assigned: any) => assigned.application_id === row.id)
              ?.call_notes || null,
          call_date:
            holderApplicantRows.find((assigned: any) => assigned.application_id === row.id)
              ?.call_date || null,
          call_outcome:
            holderApplicantRows.find((assigned: any) => assigned.application_id === row.id)
              ?.call_outcome || null,
          next_follow_up:
            holderApplicantRows.find((assigned: any) => assigned.application_id === row.id)
              ?.next_follow_up || null,
          work_start_date: null,
          work_site: row.city,
        }))
    : [];
  const applicantRows = isGaryRegionalCoordinator
    ? [
        ...regionalApplicantRows,
        ...holderApplicantRows.filter(
          (assigned: any) =>
            !regionalApplicantRows.some(
              (row: any) =>
                row.id === assigned.id || row.application_id === assigned.application_id,
            ),
        ),
      ]
    : holderApplicantRows;
  const deduplicatedApplicants =
    allApplicantAccess || isGaryRegionalCoordinator
      ? applicantRows.filter((row: any, index: number, rows: any[]) => {
          const key =
            row.application_id ||
            [
              row.user_id || '',
              row.applicant_email?.toLowerCase() || '',
              row.program_id || '',
            ].join(':');
          return (
            rows.findIndex((candidate: any) => {
              const candidateKey =
                candidate.application_id ||
                [
                  candidate.user_id || '',
                  candidate.applicant_email?.toLowerCase() || '',
                  candidate.program_id || '',
                ].join(':');
              return candidateKey === key;
            }) === index
          );
        })
      : applicantRows;

  const canonicalEnrollmentIds = new Set(enrolledRoster.map((row: any) => row.id).filter(Boolean));
  const canonicalEnrollmentKeys = new Set(enrolledRoster.map(learnerProgramKey).filter(Boolean));
  const deduplicatedConvertedStudents = convertedRoster.filter((row: any) => {
    const key = learnerProgramKey(row);
    return (
      !(row.enrollment_id && canonicalEnrollmentIds.has(row.enrollment_id)) &&
      !(key && canonicalEnrollmentKeys.has(key))
    );
  });

  const schoolApplicants = await loadApprovedSchoolApplicants(
    db,
    holderRes.data?.features,
    programsRes.data || [],
    contactAccessGranted,
    true,
  );

  return {
    mode: 'holder',
    schoolApplicants,
    holder: holderRes.data ?? null,
    profile,
    programs: programsRes.data ?? [],
    enrollments: enrolledRoster.map(trainingRecord),
    upcomingEnrollments: upcomingRoster.map(trainingRecord),
    applicants: recruitingEnabled ? deduplicatedApplicants : [],
    convertedStudents: deduplicatedConvertedStudents.map((row: any) =>
      trainingRecord({
        ...row,
        roster_source: 'holder_student',
        full_name: row.applicant_name || 'Student',
        enrollment_state: row.status,
        program_slug: null,
        training_start_date: row.work_start_date,
        training_end_date: null,
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
      }),
    ),
    hours: hoursRes.data ?? [],
    documents: documentsRes.data ?? [],
    reports: reportsRes.data ?? [],
    testingReports: await loadHolderExitReports(db, holderId),
    courseAssignments: deliveryAssignments,
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
