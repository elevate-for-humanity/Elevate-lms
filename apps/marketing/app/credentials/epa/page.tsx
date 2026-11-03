import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Certified Technician Directory | Elevate',
  robots: { index: false, follow: false },
};
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const input = await searchParams;
  const page = Math.max(1, Math.min(100000, Number.parseInt(input.page || '1') || 1));
  const db = await requireAdminClient();
  const { data: authority, error: authorityError } = await db
    .from('epa_certification_authority')
    .select('status')
    .eq('id', 'elevate')
    .maybeSingle();
  if (authorityError) throw new Error('Certification directory unavailable');
  if (authority?.status !== 'approved')
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">EPA 608 technician directory</h1>
        <p className="mt-4">
          Elevate’s independent EPA certifying-program approval is pending. No independently issued
          EPA credentials are listed.
        </p>
      </main>
    );
  const { data: rows, error } = await db
    .from('epa_native_attempts')
    .select(
      'candidate_name,candidate_city,exam_type,certificate_number,certificate_issued_at,exam_sessions!inner(status,result,review_status)',
    )
    .eq('directory_opt_out', false)
    .not('certificate_number', 'is', null)
    .eq('exam_sessions.status', 'completed')
    .eq('exam_sessions.result', 'pass')
    .eq('exam_sessions.review_status', 'clear')
    .order('certificate_number')
    .range((page - 1) * 50, page * 50);
  if (error) throw new Error('Certification directory unavailable');
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">EPA 608 certified technicians</h1>
      <p className="mt-4">
        Technicians who opted out of public listing are omitted. Individual credentials can also be
        verified using their certificate number.
      </p>
      <ul className="mt-6 space-y-4">
        {(rows || []).slice(0, 50).map((r) => (
          <li key={r.certificate_number} className="rounded-xl border p-4">
            <Link
              className="font-bold text-blue-700 underline"
              href={`/credentials/epa/${r.certificate_number}`}
            >
              {r.candidate_name}
            </Link>
            <p>
              {r.candidate_city} — {r.exam_type.replaceAll('_', ' ')} —{' '}
              {r.certificate_issued_at.slice(0, 10)}
            </p>
          </li>
        ))}
      </ul>
      <nav className="mt-6 flex gap-6">
        {page > 1 && <Link href={`?page=${page - 1}`}>Previous</Link>}
        {rows?.length === 51 && <Link href={`?page=${page + 1}`}>Next</Link>}
      </nav>
    </main>
  );
}
