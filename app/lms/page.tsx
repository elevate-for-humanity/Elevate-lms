import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lms | Elevate for Humanity',
  description: 'Lms page content.',
};

const STEPS = [
  { num: '1', title: 'Apply', desc: 'Free application. Takes 5 minutes. No prior experience required.' },
  { num: '2', title: 'Train', desc: 'Complete lessons, pass checkpoints, and build real skills.' },
  { num: '3', title: 'Get Certified', desc: 'Earn your industry credential and connect with employers.' },
];

export default async function LmsRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/learner/dashboard');

  const { requireAdminClient } = await import('@/lib/supabase/admin');
  const db = await requireAdminClient();
  const { data: dbPrograms } = db
    ? await db.from('programs')
        .select('id, title, slug, description, excerpt, image_url, duration_weeks, credential, credential_name, is_active, status')
        .eq('is_active', true).neq('status', 'archived').order('title').limit(12)
    : { data: [] };

  const programs = (dbPrograms ?? []).map((p: any) => ({
    title: p.title,
    desc: p.excerpt || p.description?.slice(0, 120) || '',
    duration: p.duration_weeks ? `${p.duration_weeks} weeks` : '—',
    credential: p.credential_name || p.credential || '—',
    image: p.image_url || '/images/pages/hvac-unit.webp',
    slug: p.slug,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Lms</h1>
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
