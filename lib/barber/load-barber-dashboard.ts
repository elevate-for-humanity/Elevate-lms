import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { BARBER_COURSE_ID, BARBER_PROGRAM_SLUG } from '@/lib/barber/constants';
import { PRESTIGE_ELEVATION_BARBER_CURRICULUM, BARBER_LMS_COURSE_PATH } from '@/lib/barber/branding';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';

/**
 * Barber Registered Apprenticeship requirements.
 *
 * RAPIDS_CONFIG is the authoritative repository source for sponsor/program
 * registration data. Do not duplicate or subtract RTI from OJL here.
 *
 * Registered program requirement:
 *   - 2,000 hours of supervised on-the-job learning (OJL)
 *   - 144 hours of related technical instruction (RTI)
 *
 * RTI is tracked separately from OJL. It is not subtracted from the 2,000 OJL
 * requirement. Transfer hours remain progress credit only and must be approved.
 */
const BARBER_RAPIDS = RAPIDS_CONFIG.programs.barber;
const REQUIRED_OJL = BARBER_RAPIDS.totalHours;
const REQUIRED_RTI = BARBER_RAPIDS.relatedInstructionHours;
const STANDARD_OJL_HOURS_PER_WEEK = 40;

export type BarberDashboardData = {
  firstName: string;
  fullName: string;
  shopName: string | null;
  enrollment: {
    id: string;
    enrollment_state: string | null;
    orientation_completed_at: string | null;
    documents_submitted_at: string | null;
    access_granted_at: string | null;
    stripe_subscription_id: string | null;
    stripe_subscription_status: string | null;
    progress_percent: number | null;
  } | null;
  hours: { ojl: number; rti: number; transferredOjl: number; transferredRti: number };
  docs: { document_type: string; status: string; verification_status: string }[];
  nextAction: { label: string; href: string; description: string };
  stats: {
    overallProgressPercent: number;
    ojlRequired: number;
    rtiRequired: number;
    rtiLessonsCompleted: number;
    rtiLessonsTotal: number;
    courseProgressPercent: number;
    weeksRemaining: number;
    certificationsEarned: number;
  };
  lms: {
    courseId: string;
    coursePath: string;
    coverUrl: string;
    accessGranted: boolean;
    title: string;
  };
};

export async function loadBarberDashboardData(): Promise<BarberDashboardData> {
  const supabase = await createClient();
  const db = await getAdminClient();
  const queryDb = db ?? supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/portal/barber');

  const [profileRes, enrollmentRes, apprenticeRes] = await Promise.all([
    queryDb.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    queryDb
      .from('program_enrollments')
      .select(
        'id, enrollment_state, orientation_completed_at, documents_submitted_at, access_granted_at, stripe_subscription_id, stripe_subscription_status, progress_percent, course_id',
      )
      .eq('user_id', user.id)
      .eq('program_slug', BARBER_PROGRAM_SLUG)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    queryDb
      .from('apprentices')
      .select('shop_id, employer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  if (
    profileRes.data?.role &&
    !['student', 'apprentice', 'admin', 'staff', 'instructor'].includes(profileRes.data.role)
  ) {
    redirect('/unauthorized');
  }

  const enrollment = enrollmentRes.data;
  let shopName: string | null = null;
  const shopId = apprenticeRes.data?.shop_id ?? apprenticeRes.data?.employer_id ?? null;
  if (shopId) {
    const { data: shop } = await queryDb.from('shops').select('name').eq('id', shopId).maybeSingle();
    shopName = shop?.name ?? null;
  }

  const [hours, docsRes] = await Promise.all([
    getApprovedHoursByType(supabase, user.id, BARBER_PROGRAM_SLUG),
    queryDb
      .from('documents')
      .select('document_type, status, verification_status')
      .eq('user_id', user.id),
  ]);

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'Apprentice';
  const fullName = profileRes.data?.full_name ?? 'Apprentice';

  const totalOjl = hours.ojl + hours.transferredOjl;
  const totalRti = hours.rti + hours.transferredRti;

  // OJL and RTI are independent RAPIDS requirements. Cap each requirement
  // separately so overage in one bucket cannot compensate for missing hours in
  // the other.
  const creditedOjl = Math.min(totalOjl, REQUIRED_OJL);
  const creditedRti = Math.min(totalRti, REQUIRED_RTI);
  const totalRequired = REQUIRED_OJL + REQUIRED_RTI;
  const overallProgressPercent = Math.min(
    100,
    Math.round(((creditedOjl + creditedRti) / totalRequired) * 100),
  );

  // Weekly employment planning is based on OJL only. RTI is completed through
  // the assigned course and is not treated as 40-hour workweeks.
  const ojlRemaining = Math.max(0, REQUIRED_OJL - creditedOjl);
  const weeksRemaining = Math.ceil(ojlRemaining / STANDARD_OJL_HOURS_PER_WEEK);

  const { data: lessons } = await queryDb
    .from('course_lessons')
    .select('id')
    .eq('course_id', BARBER_COURSE_ID);

  const lessonIds = (lessons ?? []).map((l) => l.id);
  let rtiLessonsCompleted = 0;
  if (lessonIds.length > 0) {
    const { count } = await queryDb
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', BARBER_COURSE_ID)
      .eq('completed', true);
    rtiLessonsCompleted = count ?? 0;
  }
  const rtiLessonsTotal = lessonIds.length;

  const { count: certCount } = await queryDb
    .from('program_completion_certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('course_id', BARBER_COURSE_ID);

  let courseProgressPercent = Number(enrollment?.progress_percent ?? 0);
  if (!courseProgressPercent && rtiLessonsTotal > 0) {
    courseProgressPercent = Math.round((rtiLessonsCompleted / rtiLessonsTotal) * 100);
  }

  const { data: courseRow } = await queryDb
    .from('courses')
    .select('title, thumbnail_url, status, is_active')
    .eq('id', BARBER_COURSE_ID)
    .maybeSingle();

  const nextAction = enrollment
    ? getNextRequiredAction({
        status: 'active',
        orientation_completed_at: enrollment.orientation_completed_at,
        documents_submitted_at: enrollment.documents_submitted_at,
        program_slug: BARBER_PROGRAM_SLUG,
      })
    : {
        label: 'Apply to Barber Apprenticeship',
        href: '/programs/barber-apprenticeship/apply',
        description: 'Start your enrollment application',
      };

  if (nextAction.href === '/apprentice/courses/1') {
    nextAction.href = BARBER_LMS_COURSE_PATH;
    nextAction.label = 'Open Prestige Elevation™ RTI';
    nextAction.description = 'Continue your related technical instruction on Elevate LMS';
  }

  return {
    firstName,
    fullName,
    shopName,
    enrollment,
    hours,
    docs: docsRes.data ?? [],
    nextAction,
    stats: {
      overallProgressPercent,
      ojlRequired: REQUIRED_OJL,
      rtiRequired: REQUIRED_RTI,
      rtiLessonsCompleted,
      rtiLessonsTotal,
      courseProgressPercent,
      weeksRemaining,
      certificationsEarned: certCount ?? 0,
    },
    lms: {
      courseId: BARBER_COURSE_ID,
      coursePath: BARBER_LMS_COURSE_PATH,
      coverUrl: courseRow?.thumbnail_url || PRESTIGE_ELEVATION_BARBER_CURRICULUM,
      accessGranted: Boolean(enrollment?.access_granted_at),
      title: courseRow?.title ?? 'Prestige Elevation™ Barbering RTI',
    },
  };
}
