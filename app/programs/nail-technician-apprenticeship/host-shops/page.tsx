export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Users, Award, Building2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import HostShopSyllabusRequirement from '@/components/programs/beauty/HostShopSyllabusRequirement';

export const metadata: Metadata = {
  title: 'Become a Host Nail Salon | Nail Technician Apprenticeship',
  description:
    `Partner with ${PLATFORM_DEFAULTS.orgName} as a host nail salon for our DOL-registered nail technician apprenticeship. Train the next generation of licensed nail technicians.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship/host-shops',
  },
};

export default function NailHostShopsPage() {
  return (
    <main className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship' },
          { label: 'Host Salons' },
        ]}
      />

      {/* Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full overflow-hidden">
        <Image
          src="/images/pages/nail-technician.webp"
          alt="Professional nail salon interior"
          fill sizes="100vw"
          className="object-cover"
          priority placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/70 to-transparent" />
        <div className="absolute bottom-10 left-8 max-w-xl">
          <h1 className="text-4xl font-extrabold text-white mb-2">Become a Host Nail Salon</h1>
          <p className="text-slate-200 text-lg">Train the next generation of licensed nail technicians — zero paperwork burden.</p>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Why Partner With Us?</h2>
          <p className="text-xl text-slate-600 text-center mb-16 max-w-3xl mx-auto">
            Host salons gain trained talent, DOL compliance support, and the satisfaction of building
            the next generation of licensed nail technicians.
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw" src="/images/pages/nail-technician.webp"
                alt="Nail technician training apprentice" fill className="object-cover" placeholder="empty" />
            </div>
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-purple-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Pre-Trained Talent Pipeline</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Apprentices complete theory training before arriving at your salon. They arrive
                knowing nail anatomy, sanitation protocols, and client consultation skills — ready
                to learn hands-on techniques from day one.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="w-16 h-16 bg-brand-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-brand-green-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">We Handle DOL Compliance</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Elevate manages all USDOL reporting, RAPIDS hour tracking, IPLA licensing
                coordination, and apprenticeship agreement paperwork. You focus on training —
                we handle the bureaucracy.
              </p>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl order-1 md:order-2">
              <Image sizes="100vw" src="/images/pages/nail-technician.webp"
                alt="DOL compliance documentation" fill className="object-cover" placeholder="empty" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw" src="/images/pages/nail-technician.webp"
                alt="Nail technician receiving license" fill className="object-cover" placeholder="empty" />
            </div>
            <div>
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-amber-700" aria-label="Award" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">OJT Wage Reimbursement</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Eligible host salons can receive up to 50% wage reimbursement through WIOA
                On-the-Job Training funding while the apprentice completes their 600 hours.
                Elevate coordinates the WorkOne agreement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Host Salon Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Licensed Indiana nail technician on staff as supervisor",
              "Valid Indiana salon license in good standing",
              "Workers' Compensation insurance (or valid state exemption)",
              "Minimum 1 nail station available for apprentice training",
              "Willingness to pay apprentice at least Indiana minimum wage",
              "Commitment to 600 hours of supervised OJT over 5 months",
              "Sign Elevate's Worksite MOU (DOL apprenticeship agreement)",
              "Participate in monthly competency check-ins with Elevate coordinator",
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HostShopSyllabusRequirement programSlug="nail-technician-apprenticeship" />

      {/* CTA */}
      <section className="py-16 bg-slate-900 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Host an Apprentice?</h2>
          <p className="text-slate-300 mb-8">
            Apply to become a host nail salon. Our team will review your application and reach out
            within 3 business days.
          </p>
          <Link
            href="/partners/nail-technician-apprenticeship/apply"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Apply as Host Salon →
          </Link>
        </div>
      </section>
    </main>
  );
}
