import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  ArrowRight,
  FileText,
  Shield,
  Award,
  Users,
  Handshake,
  TrendingUp,
  Target,
  Briefcase,
  GraduationCap,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/licensing-partnerships',
  },
  title: 'Licensing & Partnerships | Elevate For Humanity',
  description:
    'Partner with Elevate for Humanity. Become a licensed training provider, employer partner, or community organization. Expand your impact in workforce development.',
};

export default function LicensingPartnershipsPage() {
  const partnershipTypes = [
    {
      icon: GraduationCap,
      title: 'Training Provider',
      description:
        'Become a licensed training provider and deliver programs through our platform',
      benefits: [
        'Access to WIOA funding streams',
        'Student enrollment support',
        'Compliance and reporting tools',
        'Marketing and recruitment assistance',
      ],
      href: '/partner',
    },
    {
      icon: Briefcase,
      title: 'Employer Partner',
      description:
        'Hire our graduates and participate in work-based learning programs',
      benefits: [
        'Access to qualified candidates',
        'Apprenticeship program support',
        'Tax credits and incentives',
        'Customized training solutions',
      ],
      href: '/employer',
    },
    {
      icon: Users,
      title: 'Community Organization',
      description:
        'Partner with us to serve your community and expand workforce services',
      benefits: [
        'Referral partnerships',
        'Co-location opportunities',
        'Shared resources and facilities',
        'Joint grant applications',
      ],
      href: '/contact',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Compliance Support',
      description: 'We handle WIOA, DOL, and state compliance requirements',
    },
    {
      icon: TrendingUp,
      title: 'Proven Track Record',
      description: 'High completion and employment rates across all programs',
    },
    {
      icon: Target,
      title: 'Dedicated Support',
      description: 'Partnership managers to ensure your success',
    },
    {
      icon: Award,
      title: 'Quality Standards',
      description: 'Accredited programs with industry-recognized credentials',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Licensing Partnerships" }]} />
      </div>
{/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/licensing-partnerships-page-1.jpg" alt="Licensing Partnerships" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Section 1: For Students */}

      {/* Partnership Types */}
      <section id="types" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6">
              Partnership Opportunities
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Choose the partnership model that fits your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {partnershipTypes.map((type, idx) => {
              const Icon = type.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-blue-600 hover:shadow-xl transition-all"
                >
                  <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-brand-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    {type.title}
                  </h3>
                  <p className="text-black mb-6">{type.description}</p>
                  <ul className="space-y-3 mb-6">
                    {type.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start gap-2">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={type.href}
                    className="block text-center bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition-colors"
                  >
                    Learn More →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-6">
              Why Partner With Us?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-20 h-20 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-black">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            How to Become a Partner
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Submit Application
                </h3>
                <p className="text-black">
                  Complete our partnership application with information about
                  your organization and goals.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Review & Approval
                </h3>
                <p className="text-black">
                  Our team reviews your application and schedules a consultation
                  to discuss partnership details.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Agreement & Onboarding
                </h3>
                <p className="text-black">
                  Sign partnership agreement and complete onboarding training on
                  our systems and processes.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-black mb-2">
                  Launch Partnership
                </h3>
                <p className="text-black">
                  Begin serving students, accessing funding, and growing your
                  impact with our support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Ready to Partner With Us?</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Book a virtual meeting or apply online. All meetings are held via Zoom — a link is sent to your email automatically after booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/elevate4humanityedu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold text-base transition"
            >
              Book a Zoom Meeting <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/apply/program-holder"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold text-base hover:bg-slate-50 transition"
            >
              Apply to Partner
            </Link>
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold text-base hover:bg-slate-50 transition"
            >
              Call (317) 314-3757
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-6">
            Zoom link is sent automatically to your email after booking. No app download required.
          </p>
        </div>
      </section>
    </div>
  );
}
