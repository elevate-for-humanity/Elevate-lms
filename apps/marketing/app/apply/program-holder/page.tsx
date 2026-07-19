import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProgramHolderForm from './ProgramHolderForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Application',
  description: 'Partner with us to offer training programs to your community or organization.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/program-holder',
  },
};

const OTHER_APPLICATION_PATHS = [
  {
    label: 'Barber host shop (apprenticeship)',
    href: '/partners/barber-host-shop/apply',
    hint: 'Licensed barbershop hosting apprentices',
  },
  {
    label: 'Cosmetology host shop',
    href: '/partners/cosmetology-host-shop/apply',
    hint: 'Salon or school hosting cosmetology apprentices',
  },
  {
    label: 'Training provider (ETPL / WIOA)',
    href: '/partners/apply',
    hint: 'Organizations listing programs on Indiana ETPL',
  },
  {
    label: 'Student training application',
    href: '/apply',
    hint: 'Learners applying for funded or self-pay programs',
  },
] as const;

export default async function ProgramHolderApplicationPage() {
  const supabase = await createClient();

  await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'program_holder_applications')
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Program Holder' }]} />
      </div>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-xs font-semibold tracking-widest text-brand-blue-700 uppercase mb-2">
            Program holder application
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Partner with Elevate</h1>
          <p className="text-base sm:text-lg text-slate-700 max-w-3xl">
            Use this form if your organization will operate apprenticeship or training programs on
            the platform (shop owner, school, or workforce partner). After you submit, you can
            upload compliance documents in the program holder portal.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Looking for a different application?</h2>
          <p className="text-sm text-slate-600 mb-4">
            Several partner flows exist. Pick the one that matches your role so you are not
            duplicated in our review queue.
          </p>
          <ul className="space-y-3">
            {OTHER_APPLICATION_PATHS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-blue-300 hover:bg-brand-blue-50/40 transition"
                >
                  <span className="font-semibold text-brand-blue-700">{item.label}</span>
                  <span className="block text-sm text-slate-600 mt-0.5">{item.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ProgramHolderForm />
      </section>
    </div>
  );
}
