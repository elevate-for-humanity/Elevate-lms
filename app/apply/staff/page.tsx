import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import StaffApplicationForm from './StaffApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Staff / Instructor Application | Elevate for Humanity',
  description:
    'Join our team to support student success and workforce development.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/staff',
  },
};

export default async function StaffApplicationPage() {
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
    .eq('key', 'staff_applications')
    .single();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Staff' }]} />
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="text-xs font-semibold tracking-widest text-brand-blue-700 uppercase mb-2">
            Staff / Instructor Application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Join Our Team
          </h1>
          <p className="text-base sm:text-lg text-black max-w-3xl">
            Support student success and workforce development as part of our
            team.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <StaffApplicationForm />
      </section>
    </div>
  );
}
