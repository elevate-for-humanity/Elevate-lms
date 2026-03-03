import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import AutoProgramGenerator from '@/components/admin/AutoProgramGenerator';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Program Generator | Elevate For Humanity',
  description: 'AI-powered program structure generation.',
};

export default async function ProgramGeneratorPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Program administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Program Generator' }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Generator</h1>
        <p className="text-gray-600 mb-8">Generate program structures from templates and AI-powered recommendations.</p>
        <AutoProgramGenerator />
      </div>
    </div>
  );
}
