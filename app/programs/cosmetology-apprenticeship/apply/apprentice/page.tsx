export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CosmetologyApprenticeForm from '../CosmetologyApprenticeForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Cosmetology Apprentice Application',
  description:
    `Apply to enroll in the ${PLATFORM_DEFAULTS.orgName} DOL-registered cosmetology apprenticeship program.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship/apply/apprentice' },
};

export default function CosmetologyApprenticeApplyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship' },
              { label: 'Apply', href: '/programs/cosmetology-apprenticeship/apply' },
              { label: 'Apprentice' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/cosmetology-apprenticeship/apply"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Cosmetology Apprentice Application
          </h1>
          <p className="text-slate-600 mt-1">
            Complete the form below to apply as a cosmetology apprentice.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <CosmetologyApprenticeForm />
      </div>
    </div>
  );
}
