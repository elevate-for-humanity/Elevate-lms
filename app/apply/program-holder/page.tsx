import { Metadata } from 'next';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import ProgramHolderForm from './ProgramHolderForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Application | Elevate for Humanity',
  description:
    'Partner with us to offer training programs to your community or organization.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/program-holder',
  },
};

export default async function ProgramHolderApplicationPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch application settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'program_holder_applications')
    .single();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-[200px] sm:h-[260px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Program holder application" fill sizes="100vw" className="object-cover" priority quality={90} />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded">
          <span className="text-sm font-bold text-slate-900">Elevate for Humanity</span>
        </div>
      </div>
      <Breadcrumbs
        items={[
          { label: 'Apply', href: '/apply' },
          { label: 'Program Holder' },
        ]}
      />
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-semibold tracking-widest text-brand-blue-700 uppercase mb-2">
            Program Holder Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Partner With Us
          </h1>
          <p className="text-base sm:text-lg text-black max-w-3xl">
            Offer training programs to your community or organization through
            our platform.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ProgramHolderForm />
      </section>
    </div>
  );
}
