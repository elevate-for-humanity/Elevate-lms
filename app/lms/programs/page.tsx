import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Programs | Elevate for Humanity',
  description: 'Programs page content.',
};

export default async function ProgramAnalyticsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const [
    totalProgramsRes,
    activeProgramsRes,
    totalEnrollmentsRes,
    completedEnrollmentsRes,
    certsRes,
    programsRes,
  ] = await Promise.all([
    db.from('programs').select('id', { count: 'exact', head: true }),
    db.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    db
      .from('programs')
      .select('id, title, slug, category, is_active, credential_type, estimated_weeks, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const totalPrograms = totalProgramsRes.count ?? 0;
  const activePrograms = activeProgramsRes.count ?? 0;
  const totalEnrollments = totalEnrollmentsRes.count ?? 0;
  const completedEnroll = completedEnrollmentsRes.count ?? 0;
  const totalCerts = certsRes.count ?? 0;
  const programs = programsRes.data ?? [];

  // Per-program enrollment counts
  const { data: enrollCounts } = await db
    .from('program_enrollments')
    .select('program_id')
    .not('program_id', 'is', null);

  const enrollByProgram: Record<string, number> = {};
  for (const e of enrollCounts ?? []) {
    const pid = (e as any).program_id;
    if (pid) enrollByProgram[pid] = (enrollByProgram[pid] || 0) + 1;
  }

  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnroll / totalEnrollments) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Programs</h1>
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
