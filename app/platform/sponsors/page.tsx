import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import {
  Shield,
  TrendingUp,
  Users,
  Check,
  Globe,
  Building2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sponsors | Elevate Workforce OS',
  description:
    'Sponsor licensing for the Elevate Workforce OS. System of record for programs with signature-driven activation and audit-ready reporting.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/sponsors',
  },
};

export default async function SponsorLicensingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch sponsor licensing info
  const { data: licensing } = await db
    .from('pricing_plans')
    .select('*')
    .eq('type', 'sponsor');

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Platform", href: "/platform" }, { label: "Sponsors" }]} />
        <p className="text-sm text-slate-600 mt-1">Part of the <a href="/platform" className="text-brand-red-600 font-medium hover:underline">Elevate Workforce Operating System</a>. <a href="/store/licensing" className="hover:underline">View pricing →</a></p>
      </div>
{/* Hero Banner */}
      <ModernLandingHero
        badge="Sponsor-in-a-Box Licensing"
        headline="License Our Apprenticeship"
        accentText="Infrastructure"
        subheadline="Operate Compliant, Funded Programs Without Building From Scratch"
        description="The platform serves as the system of record for programs. Program activation is driven by required signatures. Tasks, milestones, and reporting are initialized automatically. All actions are logged for audit and reimbursement purposes."
        imageSrc="/images/pages/apply-employer-hero.jpg"
        imageAlt="Apprenticeship Licensing Partnership"
        primaryCTA={{ text: "View Pricing Tiers", href: "#pricing" }}
        secondaryCTA={{ text: "Contact Sales", href: "#contact" }}
        features={[
          "RAPIDS lifecycle tracking • DOL compliance built-in",
          "WIOA/WRG-safe infrastructure • Audit-defensible systems",
          "White-label ready • Deploy in weeks, not years"
        ]}
        imageOnRight={true}
      />

      {/* Pricing Tiers */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Choose Your Tier
            </h2>
            <p className="text-xl text-black">
              WIOA/WRG-safe, audit-defensible, ready to deploy
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-8 hover:shadow-2xl transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <Image src="/images/icons/shield.png" alt="Starter" width={24} height={24} className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">Starter</h3>
                  <p className="text-sm text-black">Local / Pilot</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-black mb-2">
                  $750<span className="text-xl text-black">/month</span>
                </div>
                <div className="text-sm text-black">+ $1,500 setup fee</div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-black font-medium mb-4">
                  Best for: Single region, small nonprofit, small workforce org
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Sponsor dashboard (referrals, employers, apprentices)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    RAPIDS lifecycle tracking
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    WIOA/WRG compatibility
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Employer onboarding + MOU workflow
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Audit logs + exports
                  </span>
                </div>
              </div>

              <div className="bg-brand-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-black mb-2">
                  Includes:
                </p>
                <ul className="text-sm text-black space-y-1">
                  <li>• Up to 5 employers</li>
                  <li>• Up to 25 apprentices</li>
                </ul>
              </div>

              <Link
                href="/store/licensing"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-4 rounded-xl font-bold transition"
              >
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white   rounded-3xl shadow-2xl border-4 border-indigo-400 p-8 relative transform lg:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-brand-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Image src="/images/icons/users.png" alt="Growth" width={24} height={24} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Professional
                  </h3>
                  <p className="text-sm text-slate-600">Regional Authority</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  $2,500<span className="text-xl text-slate-600">/month</span>
                </div>
                <div className="text-sm text-slate-600">+ $5,000 setup fee</div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-white/90 font-medium mb-4">
                  Best for: Multi-county regions, workforce boards, large
                  nonprofits
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    Everything in Starter
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    White-label branding (logo, domain, email)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    Multi-trade programs
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    WOTC + OJT tracking
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    ETPL performance dashboards
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white">
                    WorkOne read-only oversight views
                  </span>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-slate-900 mb-2">Includes:</p>
                <ul className="text-sm text-white space-y-1">
                  <li>• Up to 25 employers</li>
                  <li>• Up to 250 apprentices</li>
                </ul>
              </div>

              <Link
                href="/store/licensing"
                className="block w-full bg-white text-indigo-600 hover:bg-white text-center px-6 py-4 rounded-xl font-bold transition"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-200 p-8 hover:shadow-2xl transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">
                    Enterprise
                  </h3>
                  <p className="text-sm text-black">
                    State / Tribal / National
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-4xl font-bold text-black mb-2">
                  Custom
                </div>
                <div className="text-sm text-black">
                  $7,500–$15,000/month
                  <br />+ $25,000–$50,000 setup
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-black font-medium mb-4">
                  Best for: State agencies, tribal nations, national
                  intermediaries
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Everything in Professional
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Multi-state rules engine
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Tenant licensing enforcement
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    SOC-style audit controls
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Monitoring response bundles
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">
                    Dedicated onboarding + training
                  </span>
                </div>
              </div>

              <div className="bg-brand-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-black mb-2">
                  Includes:
                </p>
                <ul className="text-sm text-black space-y-1">
                  <li>• Unlimited employers & apprentices</li>
                  <li>• Custom contract terms</li>
                </ul>
              </div>

              <Link
                href="/contact?topic=licensing-enterprise"
                className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center px-6 py-4 rounded-xl font-bold transition"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-4">
              Optional Add-Ons
            </h2>
            <p className="text-xl text-black">À la carte services</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'State Launch Kit',
                price: '$3,500/state',
                description: 'Rules + templates for new state',
              },
              {
                title: 'Employer Billing',
                price: '$1,500 setup',
                description: 'Stripe Connect integration',
              },
              {
                title: 'Custom Reports',
                price: '$1,000 each',
                description: 'Dashboards tailored to your needs',
              },
              {
                title: 'RAPIDS API Adapter',
                price: 'Scoped',
                description: 'When permitted by state',
              },
            ].map((addon, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200"
              >
                <h3 className="font-bold text-black mb-2">{addon.title}</h3>
                <div className="text-2xl font-bold text-brand-blue-600 mb-2">
                  {addon.price}
                </div>
                <p className="text-sm text-black">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employer Fees */}
      <section className="py-20 bg-white  ">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-brand-green-100 text-brand-green-700 rounded-full text-sm font-bold mb-4">
              Allowed & Safe
            </div>
            <h2 className="text-4xl font-bold text-black mb-4">
              Employer Fees
            </h2>
            <p className="text-lg text-black">
              Paid by employer — never grant funds
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-brand-green-200">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">
                  $250–$750
                </div>
                <div className="text-sm text-black">
                  Onboarding/admin fee
                  <br />
                  (one-time)
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">
                  $50–$150
                </div>
                <div className="text-sm text-black">
                  Per-apprentice platform fee
                  <br />
                  (monthly)
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black mb-2">
                  Bundled
                </div>
                <div className="text-sm text-black">
                  Compliance/reporting
                  <br />
                  services
                </div>
              </div>
            </div>

            <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4">
              <p className="text-sm text-black">
                <strong className="text-black">Rule:</strong> Never bill
                training, wages, kits, or grant-funded costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              What You Get
            </h2>
            <p className="text-xl text-black">
              State-grade workforce infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Compliance Built-In',
                description:
                  'RAPIDS tracking, WIOA/WRG compatibility, audit logs, SOC-style controls',
              },
              {
                icon: TrendingUp,
                title: 'Performance Dashboards',
                description:
                  'ETPL metrics, retention rates, completion tracking, real-time reporting',
              },
              {
                icon: Users,
                title: 'Role-Based Access',
                description:
                  'Sponsor, employer, WorkOne views with appropriate permissions',
              },
              {
                icon: Globe,
                title: 'Multi-State Ready',
                description:
                  'State rules engine, tenant licensing, white-label branding',
              },
              {
                icon: Building2,
                title: 'Employer Tools',
                description:
                  'Onboarding workflows, MOU templates, WOTC tracking, billing integration',
              },
              {
                icon: Check,
                title: 'Audit-Ready',
                description:
                  'One-click exports, monitoring bundles, immutable audit logs',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-black">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-600">
            Credentials and instructional partners may be provided by the licensee. 
            Licensing covers platform access, automation infrastructure, and compliance reporting.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-700   text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to License?
          </h2>
          <p className="text-2xl mb-10 text-white/90">
            Let's discuss which tier fits your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/licensing"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 hover:bg-white px-10 py-5 rounded-xl font-bold text-lg transition shadow-2xl"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact?topic=sponsor-licensing"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg transition"
            >
              Licensing Questions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
