import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard | Elevate for Humanity',
  description: 'Dashboard page content.',
};

export const dynamic = 'force-dynamic';

/**
 * WORKFORCE BOARD DASHBOARD
 *
 * Oversight dashboard for workforce development boards to monitor:
 * - Program performance and outcomes
 * - Participant enrollment and completion
 * - Employment outcomes and wage gains
 * - Compliance status and audit readiness
 * - Budget utilization and ROI
 */
export default async function WorkforceBoardDashboard() {
  const { user, profile } = await requireRole([
    'workforce_board',
    'admin',
    'super_admin',
    'org_admin',
  ]);

  const supabase = await createClient();

  // Fetch dashboard metrics
  const [enrollmentsResult, completionsResult, activeResult, programsResult, providersResult] =
    await Promise.all([
      supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
      supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('partner_lms_providers').select('*', { count: 'exact', head: true }),
    ]);

  const totalEnrollments = enrollmentsResult.count || 0;
  const completedEnrollments = completionsResult.count || 0;
  const activeEnrollments = activeResult.count || 0;
  const activePrograms = programsResult.count || 0;
  const trainingProviders = providersResult.count || 0;
  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // Get recent enrollments
  // Fetch recent enrollments — hydrate profiles separately (no FK on user_id to profiles)
  const { data: rawRecentEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, created_at, user_id, programs ( title )')
    .order('created_at', { ascending: false })
    .limit(5);
  const wfUserIds = [
    ...new Set((rawRecentEnrollments || []).map((e: any) => e.user_id).filter(Boolean)),
  ];
  const { data: wfProfiles } = wfUserIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', wfUserIds)
    : { data: [] };
  const wfProfileMap = Object.fromEntries((wfProfiles || []).map((p: any) => [p.id, p]));
  const recentEnrollments = (rawRecentEnrollments || []).map((e: any) => ({
    ...e,
    profiles: wfProfileMap[e.user_id] ?? null,
  }));

  // Get at-risk participants — hydrate profiles separately
  const { data: rawAtRisk, count: atRiskCount } = await supabase
    .from('program_enrollments')
    .select('id, status, user_id, program_id', { count: 'exact' })
    .eq('at_risk', true)
    .eq('status', 'active')
    .limit(5);
  const arUserIds = [...new Set((rawAtRisk || []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: arProfiles } = arUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', arUserIds)
    : { data: [] };
  const arProfileMap = Object.fromEntries((arProfiles || []).map((p: any) => [p.id, p]));
  const atRiskParticipants = (rawAtRisk || []).map((e: any) => ({
    ...e,
    profiles: arProfileMap[e.user_id] ?? null,
  }));

  // Derive WIOA indicators from real data
  const { data: certificatesIssued } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true });
  const credentialCount = certificatesIssued?.length ?? 0;
  // Credential attainment: completers who earned at least one certificate
  const credentialAttainment =
    completedEnrollments > 0
      ? Math.min(100, Math.round((credentialCount / completedEnrollments) * 100))
      : 0;
  // Measurable skill gains: active enrollments with progress > 0
  const { count: skillGainCount } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('progress_percent', 0);
  const measurableSkillGains =
    activeEnrollments > 0 ? Math.round(((skillGainCount || 0) / activeEnrollments) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

