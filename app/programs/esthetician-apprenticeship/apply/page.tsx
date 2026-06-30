import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Store } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import FundingGateCard from '@/components/programs/FundingGateCard';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply — Esthetician Apprenticeship',
  description:
    `Apply to the ${PLATFORM_DEFAULTS.orgName} DOL-registered esthetician apprenticeship — as an apprentice or as a partner spa/salon.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship/apply' },
};

export default function EstheticianApplyIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Esthetician Apprenticeship', href: '/programs/esthetician-apprenticeship' },
              { label: 'Apply' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/esthetician-apprenticeship"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Program
            </Link>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-400 mb-2">
            DOL-Registered Apprenticeship
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Apply — Esthetician Apprenticeship
          </h1>
          <p className="text-slate-300 text-base">
            Select the application that applies to you.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <FundingGateCard
            icon={<Sparkles className="w-6 h-6 text-pink-600" />}
            title="I'm an Apprentice"
            description="I want to enroll in the esthetician apprenticeship program as a student."
            enrollHref="/apply?program=esthetician-apprenticeship&type=enrollment"
            inquiryHref="/contact?program=esthetician-apprenticeship"
            accentColor="brand-red"
          />

          <Link
            href="/partners/esthetician-apprenticeship/apply"
            className="flex items-start gap-5 p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-pink-400 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-pink-50 group-hover:bg-pink-100 flex items-center justify-center shrink-0 transition-colors">
              <Store className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg mb-1">I&apos;m a Partner Spa or Salon</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                I own or manage a spa or salon and want to host esthetician apprentices.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
