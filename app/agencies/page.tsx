import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield,
  TrendingUp,
  FileCheck,
  Phone,
  DollarSign,
  Building2,
  Users,
  Award,
  ArrowRight,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Agencies | Government-Aligned Workforce Infrastructure',
  description:
    'DOL registered. ETPL approved. WIOA compliant. License our workforce development platform.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/agencies',
  },
};

export const dynamic = 'force-dynamic';

export default async function AgenciesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get agency partners
  const { data: partners } = await supabase
    .from('partners')
    .select('id, name, logo_url, type')
    .eq('type', 'agency')
    .eq('is_active', true)
    .limit(8);

  // Get compliance certifications
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('type', 'organizational')
    .eq('is_active', true);

  // Get case studies
  const { data: caseStudies } = await supabase
    .from('case_studies')
    .select('*')
    .eq('category', 'agency')
    .eq('is_featured', true)
    .limit(3);

  const complianceFeatures = [
    { icon: Shield, title: 'DOL Registered', description: 'Registered apprenticeship sponsor with the Department of Labor' },
    { icon: FileCheck, title: 'ETPL Approved', description: 'Listed on Indiana\'s Eligible Training Provider List' },
    { icon: Award, title: 'WIOA Compliant', description: 'Full compliance with Workforce Innovation and Opportunity Act' },
    { icon: TrendingUp, title: 'Outcome Tracking', description: 'Real-time reporting on placement, retention, and wages' },
  ];

  const platformFeatures = [
    'Multi-tenant architecture for regional deployment',
    'Integrated case management and tracking',
    'Automated WIOA reporting and compliance',
    'Employer engagement portal',
    'Career pathway mapping',
    'Skills-based matching',
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
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Partner Agencies' }]} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/workforce-partner-1.jpg"
          alt="Workforce agencies and partners"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      {/* Compliance Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built for Government Compliance</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {complianceFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                  <Icon className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Enterprise-Ready Platform</h2>
              <p className="text-gray-600 mb-8">
                Our platform is designed for workforce boards, state agencies, and regional 
                partnerships. Deploy across multiple jurisdictions while maintaining 
                centralized oversight and reporting.
              </p>
              <ul className="space-y-3">
                {platformFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-100 rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 text-center">
                  <Building2 className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-gray-600 text-sm">Partner Organizations</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center">
                  <Users className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold">WIOA</div>
                  <div className="text-gray-600 text-sm">Compliant</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center">
                  <DollarSign className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold">ETPL</div>
                  <div className="text-gray-600 text-sm">Listed</div>
                </div>
                <div className="bg-white rounded-lg p-6 text-center">
                  <TrendingUp className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold">Full</div>
                  <div className="text-gray-600 text-sm">Reporting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Governance & Operational Readiness */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Platform Governance & Operational Readiness</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Partner and agency access is role-based, auditable, and governed by published operational policies to support compliance and oversight.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {governanceFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-5 shadow-sm border">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/policies"
              className="text-brand-blue-600 hover:text-brand-blue-800 font-medium"
            >
              View All Policies →
            </Link>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners && partners.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-center text-gray-500 mb-8">Trusted by agencies across Indiana</h3>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {partners.map((partner: any) => (
                <div key={partner.id} className="grayscale hover:grayscale-0 transition relative h-12 w-32">
                  {partner.logo_url ? (
                    <Image src={partner.logo_url} alt={partner.name} fill className="object-contain" sizes="128px" />
                  ) : (
                    <span className="text-gray-400 font-medium">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Studies */}
      {caseStudies && caseStudies.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study: any) => (
                <div key={study.id} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-2">{study.title}</h3>
                  <p className="text-gray-600 mb-4">{study.summary}</p>
                  {study.results && (
                    <div className="text-green-600 font-medium">{study.results}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Modernize Your Workforce System?
          </h2>
          <p className="text-brand-blue-100 mb-8">
            Schedule a demo to see how our platform can support your agency&apos;s goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/license/demo"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Schedule Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-800 transition border border-white/30"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
