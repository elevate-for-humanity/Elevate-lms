import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/workforce-board',
  },
  title: 'Workforce Board Portal | Elevate For Humanity',
  description:
    'Comprehensive workforce board portal for program oversight, performance metrics, compliance monitoring, and strategic planning.',
};

export default async function WorkforceBoardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Fetch workforce board stats
  const { count: participantCount } = await db
    .from('participants')
    .select('*', { count: 'exact', head: true });

  const features = [
    {
      image: '/images/pages/comp-cta-training.jpg',
      title: 'Performance Dashboards',
      description: 'Real-time metrics on enrollment, completion, and employment outcomes',
      href: '/workforce-board/reports',
    },
    {
      image: '/images/pages/features-hero.jpg',
      title: 'Compliance Reporting',
      description: 'Automated WIOA, DOL, and state compliance reports with audit trails',
      href: '/workforce-board/reports',
    },
    {
      image: '/images/pages/comp-cta-training.jpg',
      title: 'Participant Tracking',
      description: 'Monitor participant progress, services, and outcomes across all programs',
      href: '/workforce-board/participants',
    },
    {
      image: '/hero-images/business-hero.jpg',
      title: 'Budget Oversight',
      description: 'Track spending, allocations, and financial performance by program',
      href: '/workforce-board/reports',
    },
    {
      image: '/images/pages/comp-cta-training.jpg',
      title: 'Goal Monitoring',
      description: 'Track progress toward performance goals and benchmarks',
      href: '/workforce-board/reports/performance',
    },
    {
      image: '/images/pages/barber-gallery-1.jpg',
      title: 'Audit Readiness',
      description: 'Maintain audit-ready documentation and compliance records',
      href: '/workforce-board/reports',
    },
  ];

  const quickLinks = [
    {
      image: '/hero-images/healthcare-category.jpg',
      title: 'Participants',
      description: 'View and manage all program participants',
      href: '/workforce-board/participants',
    },
    {
      image: '/hero-images/skilled-trades-category.jpg',
      title: 'Training Programs',
      description: 'Monitor training program performance',
      href: '/workforce-board/training',
    },
    {
      image: '/hero-images/technology-category.jpg',
      title: 'Employment Outcomes',
      description: 'Track job placements and retention',
      href: '/workforce-board/employment',
    },
    {
      image: '/images/pages/comp-cta-career.jpg',
      title: 'Supportive Services',
      description: 'Review supportive services provided',
      href: '/workforce-board/supportive-services',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Workforce Board' }]} />
        </div>
      </div>

      {/* Video Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <video autoPlay muted loop playsInline preload="none" className="absolute inset-0 w-full h-full object-cover">
            <source src="/videos/staff-portal-hero.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Workforce Board Portal</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Program oversight, performance metrics, and compliance monitoring in one place</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Portal Features
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need for effective workforce program oversight
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                  <span className="inline-flex items-center gap-1 text-brand-blue-600 font-medium text-sm mt-2 group-hover:gap-2 transition-all">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Quick Access
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Jump directly to the data you need
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition"
              >
                <div className="relative h-48">
                  <Image
                    src={link.image}
                    alt={link.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-lg font-bold mb-1">{link.title}</h3>
                    <p className="text-white/80 text-sm">{link.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Access real-time workforce data and performance metrics
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-brand-blue-50 transition"
            >
              Sign In
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg transition border border-white/30"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
