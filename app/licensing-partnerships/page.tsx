import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  ArrowRight,
  FileText,
  Shield,
  CheckCircle,
  Award,
  Users,
  Handshake,
  TrendingUp,
  Target,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

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
{/* Hero Section */}
      <section className="relative bg-blue-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/logo.png"
                alt="Elevate for Humanity"
                width={200}
                height={80}
                className="brightness-0 invert"
              />
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6">
              <Handshake className="w-5 h-5" />
              <span className="text-sm font-bold">
                Partnership Opportunities
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Licensing & Partnerships
              <br />
              <span className="text-blue-300">Grow Together</span>
            </h1>

            <p className="text-2xl md:text-3xl text-white/90 mb-8 leading-relaxed font-medium">
              Partner with Elevate for Humanity to expand your impact in
              workforce development. Become a licensed training provider,
              employer partner, or community organization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition shadow-2xl hover:scale-105"
              >
                Become a Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#types"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg transition"
              >
                Explore Options
              </Link>
            </div>
          </div>
        </div>
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
                  className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-600 hover:shadow-xl transition-all"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    {type.title}
                  </h3>
                  <p className="text-black mb-6">{type.description}</p>
                  <ul className="space-y-3 mb-6">
                    {type.benefits.map((benefit, bidx) => (
                      <li key={bidx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-black text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={type.href}
                    className="block text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
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
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
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
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
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
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
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
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
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
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
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
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6">
            Ready to Partner With Us?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Join our network of training providers, employers, and community
            organizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-10 py-5 rounded-xl text-lg font-black shadow-2xl hover:scale-105 transition-all"
            >
              Apply to Partner
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              href="/partner"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-5 rounded-xl text-lg font-black transition-all"
            >
              Learn More
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            Questions? Contact us at (317) 314-3757
          </p>
        </div>
      </section>
    </div>
  );
}
