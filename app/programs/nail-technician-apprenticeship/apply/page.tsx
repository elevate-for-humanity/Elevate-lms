import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Store } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import FundingGateCard from '@/components/programs/FundingGateCard';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Apply — Nail Technician Apprenticeship',
  description:
    `Apply to the ${PLATFORM_DEFAULTS.orgName} DOL-registered nail technician apprenticeship — as an apprentice or as a partner nail salon.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship/apply' },
};

export default function NailApplyIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
              { label: 'Apply' },
            ]}
          />
          <div className="mt-4">
            <Link
              href="/programs/nail-technician-apprenticeship"
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
          <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
            DOL-Registered Apprenticeship
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Apply — Nail Technician Apprenticeship
          </h1>
          <p className="text-slate-300 text-base">
            Select the application that applies to you.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          <FundingGateCard
            icon={<Sparkles className="w-6 h-6 text-purple-600" />}
            title="I'm an Apprentice"
            description="I want to enroll in the nail technician apprenticeship program as a student."
            enrollHref="/programs/nail-technician-apprenticeship/apply/apprentice"
            inquiryHref="/contact?program=nail-technician-apprenticeship"
            routeFundedToEnrollment
            accentColor="brand-red"
          />

          <Link
            href="/partners/nail-technician-apprenticeship/apply"
            className="flex items-start gap-5 p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center shrink-0 transition-colors">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg mb-1">I&apos;m a Partner Nail Salon</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                I own or manage a nail salon and want to host nail technician apprentices.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
