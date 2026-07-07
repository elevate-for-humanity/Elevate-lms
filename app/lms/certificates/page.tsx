import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Certificates | Elevate for Humanity',
  description: 'Certificates page content.',
};

export default async function CertificatesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [certsRes, thisMonthRes] = await Promise.all([
    db
      .from('program_completion_certificates')
      .select('id, issued_at, certificate_number, user_id, program_id', { count: 'exact' })
      .order('issued_at', { ascending: false })
      .limit(100),
    db
      .from('program_completion_certificates')
      .select('id', { count: 'exact', head: true })
      .gte('issued_at', monthStart),
  ]);

  const certs = certsRes.data ?? [];
  const total = certsRes.count ?? 0;
  const thisMonth = thisMonthRes.count ?? 0;

  // Hydrate profiles and programs
  const userIds = [...new Set(certs.map((c: any) => c.user_id).filter(Boolean))];
  const programIds = [...new Set(certs.map((c: any) => c.program_id).filter(Boolean))];

  const [{ data: profiles }, { data: programs }] = await Promise.all([
    userIds.length
      ? db.from('profiles').select('id, full_name, email').in('id', userIds)
      : { data: [] },
    programIds.length ? db.from('programs').select('id, title').in('id', programIds) : { data: [] },
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
  const programMap = Object.fromEntries((programs ?? []).map((p: any) => [p.id, p]));

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Certificates</h1>
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
