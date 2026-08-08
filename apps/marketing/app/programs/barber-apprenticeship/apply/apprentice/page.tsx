export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import BarberApprenticeApplyForm from '../BarberApprenticeApplyForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Barber Apprentice Application',
  description: `Apply to enroll in the ${PLATFORM_DEFAULTS.orgName} DOL-registered barber apprenticeship program.`,
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply/apprentice',
  },
};

export default function BarberApprenticeApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              {
                label: 'Barber Apprenticeship',
                href: '/programs/barber-apprenticeship',
              },
              {
                label: 'Apply',
                href: '/programs/barber-apprenticeship/apply',
              },
              { label: 'Apprentice' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-950">
            Barber Apprentice Application
          </h1>
          <p className="mt-2 text-base text-slate-700">
            Complete the enrollment application. Payment, funding, applicant prefill, and existing
            application references are preserved when provided in the link.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <BarberApprenticeApplyForm />
      </div>
    </div>
  );
}
