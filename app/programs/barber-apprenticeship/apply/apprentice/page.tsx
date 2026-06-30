export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ApprenticeForm from '../ApprenticeForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Barber Apprentice Application',
  description:
    `Apply to enroll in the ${PLATFORM_DEFAULTS.orgName} DOL-registered barber apprenticeship program.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply/apprentice' },
};

export default function BarberApprenticeApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
              { label: 'Apply', href: '/programs/barber-apprenticeship/apply' },
              { label: 'Apprentice' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Barber Apprentice Application
          </h1>
          <p className="text-slate-600 mt-1">
            Complete the form below to apply as a barber apprentice.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <BarberApprenticeApplyForm />
      </div>
    </div>
  );
}
