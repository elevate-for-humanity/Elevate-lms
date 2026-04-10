import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import MyDashboard from './MyDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Dashboard | Elevate for Humanity',
  robots: { index: false, follow: false },
};

// Tabs visible per role
const ROLE_TABS: Record<string, string[]> = {
  super_admin:     ['admin', 'education', 'trades', 'workforce', 'business'],
  admin:           ['admin', 'education', 'trades', 'workforce', 'business'],
  org_admin:       ['admin', 'education', 'trades', 'workforce', 'business'],
  staff:           ['workforce', 'education', 'trades'],
  instructor:      ['education'],
  mentor:          ['education'],
  case_manager:    ['workforce'],
  program_holder:  ['business', 'education'],
  delegate:        ['business', 'education'],
  provider_admin:  ['business', 'education'],
  partner:         ['trades'],
  employer:        ['business', 'workforce'],
  workforce_board: ['workforce', 'business'],
  creator:         ['education'],
  student:         ['education'],
};

const DEFAULT_TAB: Record<string, string> = {
  super_admin:     'admin',
  admin:           'admin',
  org_admin:       'admin',
  staff:           'workforce',
  instructor:      'education',
  mentor:          'education',
  case_manager:    'workforce',
  program_holder:  'business',
  delegate:        'business',
  provider_admin:  'business',
  partner:         'trades',
  employer:        'business',
  workforce_board: 'workforce',
  creator:         'education',
  student:         'education',
};

export default async function MyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/my-dashboard');

  const db = await getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id, first_name, last_name, full_name, role, email, avatar_url, enrollment_status, onboarding_completed')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'student';

  // Gate: students must complete onboarding before accessing the dashboard
  const bypassOnboarding = ['admin', 'super_admin', 'org_admin', 'staff', 'instructor',
    'mentor', 'case_manager', 'creator', 'vita_staff', 'supersonic_staff'].includes(role);
  if (!bypassOnboarding && !profile?.onboarding_completed) {
    redirect('/onboarding/learner');
  }

  const tabs = ROLE_TABS[role] ?? ['education'];
  const defaultTab = DEFAULT_TAB[role] ?? 'education';

  // Load data for all visible tabs in parallel
  const [educationData, tradesData, workforceData, businessData, adminData] = await Promise.all([

    tabs.includes('education') ? (async () => {
      const [enrollRes, lessonsRes] = await Promise.all([
        db.from('program_enrollments')
          .select('id, status, progress_percent, enrolled_at, programs(title, slug)')
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false })
          .limit(5),
        db.from('lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('completed', true),
      ]);
      // Instructor: courses they teach
      let taughtCourses: any[] = [];
      if (['instructor', 'admin', 'super_admin', 'staff'].includes(role)) {
        const { data } = await db
          .from('training_courses')
          .select('id, course_name, is_active, enrolled_count')
          .order('created_at', { ascending: false })
          .limit(6);
        taughtCourses = data ?? [];
      }
      return {
        enrollments: enrollRes.data ?? [],
        completedLessons: lessonsRes.count ?? 0,
        taughtCourses,
      };
    })() : Promise.resolve(null),

    tabs.includes('trades') ? (async () => {
      const TARGETS: Record<string, number> = {
        'barber-apprenticeship': 2000,
        cosmetology: 1500,
        'nail-tech': 450,
        esthetician: 700,
      };
      const { data: hours } = await db
        .from('apprentice_hours')
        .select('hours, discipline, status, submitted_at')
        .eq('user_id', user.id)
        .eq('status', 'approved');
      const byDiscipline: Record<string, number> = {};
      (hours ?? []).forEach(h => {
        byDiscipline[h.discipline] = (byDiscipline[h.discipline] ?? 0) + (h.hours ?? 0);
      });
      // Partner shop info
      const { data: partnerLink } = await db
        .from('partner_users')
        .select('partner_id, status, partners(id, partner_type, onboarding_completed, mou_signed, approval_status)')
        .eq('user_id', user.id)
        .maybeSingle();
      // Pending apprentice hours for shop owners
      let pendingHours: any[] = [];
      if (partnerLink?.partner_id) {
        const { data } = await db
          .from('apprentice_hours')
          .select('id, user_id, hours, discipline, submitted_at, profiles(first_name, last_name)')
          .eq('partner_id', partnerLink.partner_id)
          .eq('status', 'pending')
          .order('submitted_at', { ascending: false })
          .limit(10);
        pendingHours = data ?? [];
      }
      return { byDiscipline, targets: TARGETS, partner: partnerLink ?? null, pendingHours };
    })() : Promise.resolve(null),

    tabs.includes('workforce') ? (async () => {
      const [appRes, activeRes, completedRes] = await Promise.all([
        db.from('applications')
          .select('id, status, first_name, last_name, program_interest, created_at')
          .in('status', ['submitted', 'pending_workone'])
          .order('created_at', { ascending: false })
          .limit(10),
        db.from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        db.from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
      ]);
      return {
        pendingApps: appRes.data ?? [],
        activeEnrollments: activeRes.count ?? 0,
        completions: completedRes.count ?? 0,
      };
    })() : Promise.resolve(null),

    tabs.includes('business') ? (async () => {
      const [programRes, enrollRes, certRes] = await Promise.all([
        db.from('programs')
          .select('id, title, slug, is_active, status')
          .order('created_at', { ascending: false })
          .limit(8),
        db.from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        db.from('certificates')
          .select('id', { count: 'exact', head: true }),
      ]);
      return {
        programs: programRes.data ?? [],
        activeEnrollments: enrollRes.count ?? 0,
        certificates: certRes.count ?? 0,
      };
    })() : Promise.resolve(null),

    tabs.includes('admin') ? (async () => {
      const [userRes, appRes, enrollRes, certRes] = await Promise.all([
        db.from('profiles').select('id', { count: 'exact', head: true }),
        db.from('applications')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'pending_workone']),
        db.from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        db.from('certificates')
          .select('id', { count: 'exact', head: true }),
      ]);
      return {
        totalUsers: userRes.count ?? 0,
        pendingApps: appRes.count ?? 0,
        activeEnrollments: enrollRes.count ?? 0,
        certificates: certRes.count ?? 0,
      };
    })() : Promise.resolve(null),
  ]);

  return (
    <MyDashboard
      profile={profile}
      role={role}
      tabs={tabs}
      defaultTab={defaultTab}
      educationData={educationData}
      tradesData={tradesData}
      workforceData={workforceData}
      businessData={businessData}
      adminData={adminData}
    />
  );
}
