import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Award, Briefcase } from 'lucide-react';
import PageVideoHero from '@/components/ui/PageVideoHero';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/hire-graduates',
  },
  title: 'Hire Graduates | Elevate For Humanity',
  description:
    'Access tools and resources for workforce development.',
};

export default async function HireGraduatesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">

      <PageVideoHero
        videoSrc="/videos/employer-hero.mp4"
        posterSrc="/images/pages/hire-graduates-page-1.jpg"
        posterAlt="Hire Graduates — Elevate for Humanity"
        size="marketing"
      />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch job-ready graduates
  const { data: graduates } = await db
    .from('students')
    .select('*')
    .eq('status', 'job_ready')
    .limit(20);
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Hire Graduates" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/hire-graduates-page-1.jpg"
          alt="Hire Graduates"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Hire Graduates
                </h2>
                <p className="text-black mb-6">
                  Tools and resources for career advancement
                  workforce training and career success.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/pages/hire-graduates-page-1.jpg"
                  alt="Hire Graduates"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <BookOpen className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Learn</h3>
                <p className="text-black">Access quality training programs</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Award className="w-8 h-8 text-brand-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Certify</h3>
                <p className="text-black">Earn industry certifications</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Briefcase className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Work</h3>
                <p className="text-black">Get hired in your field</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ for Employers */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Employer FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Is there a fee to hire graduates?', a: 'No. There is no recruiting fee or placement fee. We are funded by workforce development grants, not employer fees.' },
              { q: 'What training do graduates receive?', a: 'Graduates complete industry-recognized training programs with certifications. Programs include healthcare (CNA, MA), skilled trades (HVAC, welding), technology (IT, cybersecurity), and more.' },
              { q: 'How do I request candidates?', a: 'Contact us through the form above or call (317) 314-3757. Tell us about your hiring needs and we\'ll match you with qualified candidates.' },
              { q: 'Can I interview candidates before hiring?', a: 'Yes. We provide candidate profiles and you conduct your own interviews. We facilitate introductions but hiring decisions are yours.' },
              { q: 'Do you provide ongoing support after hiring?', a: 'Yes. We offer retention support for both employers and new hires. If issues arise, our team can help mediate and provide additional resources.' },
              { q: 'What if a hire doesn\'t work out?', a: 'We work with you to understand what happened and can provide replacement candidates. Our goal is long-term successful placements.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl overflow-hidden shadow-sm group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Hire Trained Talent?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Connect with job-ready graduates at no cost to your organization.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact?type=employer"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg"
              >
                Request Candidates
              </Link>
              <Link
                href="/employer"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
