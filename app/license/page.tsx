import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle, 
  Building2, 
  Users, 
  Briefcase,
  GraduationCap,
  Route,
  ClipboardCheck,
  Handshake,
  Calendar,
  Zap
} from 'lucide-react';
import { 
  LICENSE_TIERS, 
  INTEGRATIONS, 
  ROUTES, 
  DISCLAIMERS,
  getStartingPrice 
} from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'License the Elevate LMS + Workforce Hub | Elevate for Humanity',
  description: 'White-label LMS + Workforce Platform Licensing. Built for training providers, workforce boards, and employer partners. Starting at $4,999.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license',
  },
};

export default async function LicensePage() {

  const startingPrice = getStartingPrice();

  // Queries wrapped in try/catch — tables/columns may not exist yet
  let licenseTiers: any[] | null = null;
  let testimonials: any[] | null = null;
  let partners: any[] | null = null;

  try {
    const supabase = createPublicClient();
    if (supabase) {
      const [tiersResult, testimonialsResult, partnersResult] = await Promise.allSettled([
        supabase.from('license_tiers').select('*').eq('is_active', true).order('price', { ascending: true }),
        supabase.from('testimonials').select('*').eq('is_featured', true).limit(3),
        supabase.from('partners').select('id, name').eq('is_active', true).limit(6),
      ]);
      if (tiersResult.status === 'fulfilled') licenseTiers = tiersResult.value.data;
      if (testimonialsResult.status === 'fulfilled') testimonials = testimonialsResult.value.data;
      if (partnersResult.status === 'fulfilled') partners = partnersResult.value.data;
    }
  } catch {
    // DB unavailable — fall through to static fallbacks
  }

  const displayTiers = licenseTiers && licenseTiers.length > 0 ? licenseTiers : LICENSE_TIERS;

  const features = [
    { icon: Zap, title: 'Self-Operating Automation', description: 'Runs the entire learner lifecycle — from application to credential — without staff intervention' },
    { icon: GraduationCap, title: 'LMS Platform', description: 'Full learning management with courses, assessments, and automated certifications' },
    { icon: Users, title: 'Automated Enrollment', description: 'Auto-routing, status transitions, and progress tracking with zero manual entry' },
    { icon: Briefcase, title: 'Employer Portal', description: 'Connect graduates with hiring employers through automated pipelines' },
    { icon: ClipboardCheck, title: 'Compliance Automation', description: 'WIOA tracking, audit logs, and exportable reports — built-in, not bolted on' },
    { icon: Handshake, title: 'Partner Network', description: 'Access to employer and training provider network with automated matching' },
  ];

  const governanceFeatures = [
    'Role-based access control with server-side enforcement',
    'Auditable system activity and event logging',
    'Published service level targets',
    'Documented incident response procedures',
    'Tested disaster recovery processes',
    'Secure document handling with defined data retention standards',
  ];



  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License' }]} />
        </div>
      </div>

      {/* HERO BANNER */}
      <section className="relative bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
                License the Elevate LMS + Workforce Hub
              </h1>
              <p className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-8 leading-relaxed">
                Self-operating workforce infrastructure that runs the entire learner lifecycle — from application to credential — without staff. Built for funded training, employer pipelines, and apprenticeships.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Link
                  href={ROUTES.schedule}
                  className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-orange-700 transition text-sm sm:text-lg"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule Demo
                </Link>
                <Link
                  href={ROUTES.licensePricing}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/20 transition text-sm sm:text-lg"
                >
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <p className="text-slate-400 text-sm">
                Starting at ${startingPrice.toLocaleString()}/year
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Platform Highlights</h3>
                <ul className="space-y-3">
                  {features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      {feature.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <Icon className="w-10 h-10 text-orange-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Automated Self-Service Operations Section */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Automated, Self-Service Operations</h2>
          <p className="text-lg text-slate-300 text-center mb-8 max-w-3xl mx-auto">
            This platform operates as a self-service workforce system. Enrollment triggers automated workflows for eligibility, course assignment, progress tracking, compliance logging, credential issuance, and reporting. Staff intervention is required only for exceptions—not daily operations.
          </p>
          <div className="max-w-2xl mx-auto">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-lg">Automated enrollment orchestration</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-lg">Rules-based progress and hour tracking</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-lg">Automated nudges and interventions</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-lg">Auto-generated compliance and outcome reports</span>
              </li>
              <li className="flex items-start gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-lg">Credential issuance with public verification</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Licensing Options</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Choose the tier that fits your organization's needs
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {displayTiers.map((tier: any, index: number) => (
              <div 
                key={index} 
                className={`bg-white rounded-xl p-8 shadow-sm border-2 ${
                  tier.popular ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                {tier.popular && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-4">{tier.name}</h3>
                <div className="text-3xl font-bold text-orange-600 my-4">
                  ${tier.price?.toLocaleString()}<span className="text-lg text-gray-500">/year</span>
                </div>
                <p className="text-gray-600 mb-6">{tier.description}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={ROUTES.schedule}
                  className={`block text-center py-3 rounded-lg font-semibold transition ${
                    tier.popular 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Governance & Operational Readiness */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Platform Governance & Operational Readiness</h2>
          <p className="text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Partner and agency access is role-based, auditable, and governed by published operational policies to support compliance and oversight.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {governanceFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-gray-50 rounded-lg p-5 border">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/policies"
              className="text-orange-600 hover:text-orange-800 font-medium"
            >
              View All Policies →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Licensees Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                  {testimonial.organization && (
                    <div className="text-sm text-gray-500">{testimonial.organization}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners */}
      {partners && partners.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-center text-gray-500 mb-8">Trusted by organizations across Indiana</h3>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {partners.map((partner: any) => (
                <div key={partner.id} className="grayscale hover:grayscale-0 transition relative h-12 w-32">
                  <span className="text-gray-400 font-medium">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Improve Your Workforce Programs?
          </h2>
          <p className="text-orange-100 mb-8">
            Schedule a demo to see how the Elevate platform can work for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ROUTES.schedule}
              className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Schedule Demo
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-orange-700 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>{DISCLAIMERS.pricing}</p>
        </div>
      </section>
    </div>
  );
}
