import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { getNextRequiredAction } from '@/lib/enrollment/gate';
import { BARBER_COURSE_ID, BARBER_PROGRAM_SLUG } from '@/lib/barber/constants';
import { BARBER_CURRICULUM_COVER, BARBER_LMS_COURSE_PATH } from '@/lib/barber/branding';

const REQUIRED_OJL = 1500;
const REQUIRED_RTI = 500;

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
  hours: { ojl: number; rti: number };
  docs: { document_type: string; status: string; verification_status: string }[];
  nextAction: { label: string; href: string; description: string };
  stats: {
    overallProgressPercent: number;
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
    !['student', 'admin', 'super_admin', 'staff', 'instructor'].includes(profileRes.data.role)
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

  const totalHours = hours.ojl + hours.rti;
  const totalRequired = REQUIRED_OJL + REQUIRED_RTI;
  const overallProgressPercent =
    totalRequired > 0 ? Math.min(100, Math.round((totalHours / totalRequired) * 100)) : 0;
  const weeksRemaining = Math.max(0, Math.ceil((totalRequired - totalHours) / 40));

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
      .eq('status', 'completed');
    rtiLessonsCompleted = count ?? 0;
  }
  const rtiLessonsTotal = lessonIds.length > 0 ? lessonIds.length : 50;

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
      rtiLessonsCompleted,
      rtiLessonsTotal,
      courseProgressPercent,
      weeksRemaining,
      certificationsEarned: certCount ?? 0,
    },
    lms: {
      courseId: BARBER_COURSE_ID,
      coursePath: BARBER_LMS_COURSE_PATH,
      coverUrl: courseRow?.thumbnail_url || BARBER_CURRICULUM_COVER,
      accessGranted: Boolean(enrollment?.access_granted_at),
      title: courseRow?.title ?? 'Prestige Elevation™ Barbering RTI',
    },
  };
}
