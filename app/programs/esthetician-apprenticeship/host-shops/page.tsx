export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Users, Award, Building2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import HostShopSyllabusRequirement from '@/components/programs/beauty/HostShopSyllabusRequirement';

export const metadata: Metadata = {
  title: 'Become a Host Spa | Esthetician Apprenticeship',
  description:
    `Partner with ${PLATFORM_DEFAULTS.orgName} as a host spa or salon for our DOL-registered esthetician apprenticeship. Train the next generation of licensed estheticians.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship/host-shops',
  },
};

export default function EstheticianHostShopsPage() {
  return (
    <main className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Esthetician Apprenticeship', href: '/programs/esthetician-apprenticeship' },
          { label: 'Host Spas' },
        ]}
      />

      {/* Hero */}
      <section className="relative h-[38vh] min-h-[220px] max-h-[420px] w-full overflow-hidden">
        <Image
          src="/images/pages/cosmetology-hero.webp"
          alt="Professional spa interior with esthetician stations"
          fill sizes="100vw"
          className="object-cover"
          priority placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/70 to-transparent" />
        <div className="absolute bottom-10 left-8 max-w-xl">
          <h1 className="text-4xl font-extrabold text-white mb-2">Become a Host Spa</h1>
          <p className="text-slate-200 text-lg">Train the next generation of licensed estheticians — zero paperwork burden.</p>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">Why Partner With Us?</h2>
          <p className="text-xl text-slate-600 text-center mb-16 max-w-3xl mx-auto">
            Host spas gain trained talent, DOL compliance support, and the satisfaction of building
            the next generation of licensed estheticians.
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/cosmetology-hero.webp"
                alt="Esthetician training apprentice"
                fill className="object-cover" placeholder="empty"
              />
            </div>
            <div>
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-pink-700" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Pre-Trained Talent Pipeline</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Apprentices complete theory training before arriving at your spa. They arrive
                knowing skin anatomy, sanitation protocols, and client consultation skills — ready
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
              <Image sizes="100vw"
                src="/images/pages/cosmetology-hero.webp"
                alt="DOL compliance documentation"
                fill className="object-cover" placeholder="empty"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image sizes="100vw"
                src="/images/pages/cosmetology-hero.webp"
                alt="Esthetician receiving credential"
                fill className="object-cover" placeholder="empty"
              />
            </div>
            <div>
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-amber-700" aria-label="Award" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">OJT Wage Reimbursement</h3>
              <p className="text-slate-600 text-lg leading-relaxed">
                Eligible host spas can receive up to 50% wage reimbursement through WIOA
                On-the-Job Training funding while the apprentice completes their 1,500 hours.
                Elevate coordinates the WorkOne agreement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Host Spa Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Licensed Indiana esthetician or cosmetologist on staff as supervisor",
              "Valid Indiana salon/spa license in good standing",
              "Workers' Compensation insurance (or valid state exemption)",
              "Minimum 1 treatment room available for apprentice training",
              "Willingness to pay apprentice at least Indiana minimum wage",
              "Commitment to 1,500 hours of supervised OJT over 12–18 months",
              "Sign Elevate's Worksite MOU (DOL apprenticeship agreement)",
              "Participate in monthly competency check-ins with Elevate coordinator",
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200">
                <Shield className="w-5 h-5 text-pink-600 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HostShopSyllabusRequirement programSlug="esthetician-apprenticeship" />

      {/* CTA */}
      <section className="py-16 bg-slate-900 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Building2 className="w-12 h-12 text-pink-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Host an Apprentice?</h2>
          <p className="text-slate-300 mb-8">
            Apply to become a host spa. Our team will review your application and reach out
            within 3 business days.
          </p>
          <Link
            href="/partners/esthetician-apprenticeship/apply"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Apply as Host Spa →
          </Link>
        </div>
      </section>
    </main>
  );
}
