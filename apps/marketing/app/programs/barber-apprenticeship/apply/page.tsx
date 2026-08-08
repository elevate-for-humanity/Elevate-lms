import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Scissors, Store } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import FundingGateCard from '@/components/programs/FundingGateCard';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply — Barber Apprenticeship',
  description: `Apply to the ${PLATFORM_DEFAULTS.orgName} DOL-registered barber apprenticeship — as an apprentice or as a partner barbershop.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply' },
};

export default function BarberApplyIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' }, { label: 'Apply' }]} />
          <div className="mt-4">
            <Link href="/programs/barber-apprenticeship" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" /> Back to Program
            </Link>
          </div>
        </div>
      </div>

      <section className="bg-slate-950 py-10 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-300">DOL-Registered Apprenticeship</p>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">Apply — Barber Apprenticeship</h1>
          <p className="text-base text-slate-200">Choose the correct path. Apprentice enrollment and host-shop partnership are separate applications.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          <FundingGateCard
            icon={<Scissors className="h-6 w-6 text-brand-red-600" />}
            title="I'm an Apprentice"
            description="I want to enroll in the barber apprenticeship program as a student."
            enrollHref="/programs/barber-apprenticeship/apply/apprentice"
            inquiryHref="/programs/barber-apprenticeship/request-info"
            routeFundedToEnrollment
          />

          <Link href="/host-shop/apply" className="group flex items-start gap-5 rounded-xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-brand-red-400 hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-brand-red-50">
              <Store className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <p className="mb-1 text-lg font-bold text-slate-950">I'm a Host Shop / Employer</p>
              <p className="text-sm leading-relaxed text-slate-700">I own or manage a shop and want to host apprentices. Open the separate employer application.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
