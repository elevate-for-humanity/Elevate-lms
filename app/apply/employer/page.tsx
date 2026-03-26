import { Metadata } from 'next';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import EmployerApplicationForm from './EmployerApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Application | Elevate for Humanity',
  description:
    'Partner with us to find qualified candidates and build your workforce.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/employer',
  },
};

export default async function EmployerApplicationPage() {
  const supabase = await createClient();

  
  // Fetch employer application settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'employer_applications')
    .single();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[260px] overflow-hidden">
        <Image src="/images/pages/apply-employer-hero.jpg" alt="Employer partnership" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded">
          <span className="text-sm font-bold text-slate-900">Elevate for Humanity</span>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Employer' }]} />
        </div>
      </div>

      <section className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-semibold tracking-widest text-brand-orange-700 uppercase mb-2">
            Employer Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Partner With Us
          </h1>
          <p className="text-base sm:text-lg text-black max-w-3xl">
            Find qualified candidates, post job openings, and participate in
            apprenticeship programs.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <EmployerApplicationForm />
      </section>
    </div>
  );
}
