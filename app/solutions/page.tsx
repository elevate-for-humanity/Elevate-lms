import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  Building2,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Phone,
CheckCircle, } from 'lucide-react';



export const metadata: Metadata = {
  title: 'Solutions | Elevate For Humanity LMS',
  description:
    'Workforce training solutions for organizations, government agencies, and training providers. White-label LMS with integrated content partners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/solutions',
  },
};

const solutions = [
  {
    title: 'Workforce Development Agencies',
    icon: Building2,
    description:
      'Complete platform for WIOA, WRG, and grant-funded training programs',
    features: [
      'ETPL compliance tracking',
      'Grant management & reporting',
      'Multi-program administration',
      'Student outcome tracking',
    ],
    cta: 'Learn More',
    href: '/solutions/workforce',
  },
  {
    title: 'Training Providers',
    icon: GraduationCap,
    description:
      'White-label LMS for delivering your training programs at scale',
    features: [
      'Custom branding & domain',
      'Integrated content library',
      'Certificate management',
      'Payment processing',
    ],
    cta: 'Get Demo',
    href: '/demo/admin',
  },
  {
    title: 'Employers & HR Teams',
    icon: Users,
    description:
      'Upskill your workforce with industry-recognized certifications',
    features: [
      'Employee training tracking',
      'Compliance certifications',
      'Skills gap analysis',
      'ROI reporting',
    ],
    cta: 'Schedule a Demo',
    href: '/contact?topic=enterprise',
  },
  {
    title: 'Distance Learning',
    icon: GraduationCap,
    description:
      'Fully online delivery for remote learners and distributed cohorts',
    features: [
      'Async & live session support',
      'Virtual proctoring',
      'Progress tracking',
      'Mobile-friendly interface',
    ],
    cta: 'Learn More',
    href: '/solutions/distance-learning',
  },
  {
    title: 'Higher Education',
    icon: Building2,
    description:
      'Credential and continuing education programs for colleges and universities',
    features: [
      'Credit hour tracking',
      'Accreditation reporting',
      'Student information integration',
      'Workforce alignment',
    ],
    cta: 'Learn More',
    href: '/solutions/higher-ed',
  },
  {
    title: 'K-12 Career Pathways',
    icon: Users,
    description:
      'Career and technical education pathways for high school students',
    features: [
      'CTE program management',
      'Dual enrollment support',
      'Industry credential prep',
      'Parent & counselor portals',
    ],
    cta: 'Learn More',
    href: '/solutions/k12',
  },
];

const products = [
  {
    name: 'CareerSafe OSHA Training',
    description: 'OSHA 10 & 30-hour safety certifications',
    logo: '🛡️',
    href: '/partners/careersafe',
  },
  {
    name: 'HSI Health & Safety',
    description: 'CPR, AED, First Aid certifications',
    logo: '❤️',
    href: '/partners/hsi',
  },
  {
    name: 'NRF Foundation RISE Up',
    description: 'Retail industry credentials',
    logo: '🏪',
    href: '/partners/nrf',
  },
  {
    name: 'Elevate LMS',
    description: 'Cosmetology & barber training',
    logo: '✂️',
    href: '/programs/barber-apprenticeship',
  },
];

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Solutions" }]} />
      </div>
{/* Hero Section */}
      <section className="relative bg-brand-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-semibold mb-6">
                Trusted by 100+ Organizations
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Workforce Training for Agencies, Providers & Employers
              </h1>
              <p className="text-base md:text-lg mb-8 text-brand-blue-50">
                We partner with workforce boards, training providers, and employers 
                to deliver WIOA-compliant programs. Our platform handles enrollment, 
                tracking, and reporting so you can focus on outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/demo/admin"
                  className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition shadow-xl"
                >
                  Get Interactive Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="https://calendly.com/elevate4humanityedu" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
                >
                  Schedule a Demo
                </Link>
              </div>
            </div>
            <div className="relative h-96 bg-white/10 rounded-2xl backdrop-blur-sm p-8 overflow-hidden">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  <GraduationCap className="w-5 h-5 inline-block" />
                </div>
                <div className="text-2xl font-bold mb-2">30+ Programs</div>
                <div className="text-white mb-6">
                  Healthcare • Trades • Technology
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-3xl font-bold">10K+</div>
                    <div className="text-white">Students Trained</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-white">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-black mb-4">
              Solutions for Every Organization
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
              Whether you're a workforce agency, training provider, or employer,
              we have a solution that fits your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution) => {
              const Icon = solution.icon;
              return (
                <div
                  key={solution.title}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition"
                >
                  <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-lg font-bold text-black mb-4">
                    {solution.title}
                  </h3>
                  <p className="text-black mb-6">{solution.description}</p>
                  <ul className="space-y-3 mb-8">
                    {solution.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        <span className="text-sm text-black">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={solution.href}
                    className="inline-flex items-center text-brand-blue-600 font-semibold hover:text-brand-blue-700"
                  >
                    {solution.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrated Content Partners */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-black mb-4">
              Integrated Content Partners
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
              Access industry-leading training content through our platform. No
              separate logins or integrations needed.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition text-center group"
              >
                <div className="text-5xl mb-4">{product.logo}</div>
                <h3 className="text-lg font-bold text-black mb-2 group-hover:text-brand-blue-600 transition">
                  {product.name}
                </h3>
                <p className="text-sm text-black">{product.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold mb-6">
            Questions About Our Programs?
          </h2>
          <p className="text-base md:text-lg text-slate-600 mb-8">
            Contact us at (317) 314-3757 or schedule a walkthrough of our platform.
            We'll show you exactly how enrollment, tracking, and reporting works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo/admin"
              className="inline-flex items-center justify-center bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition shadow-xl"
            >
              Try Interactive Demo
            </Link>
            <Link
              href="https://calendly.com/elevate4humanityedu" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-white mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
