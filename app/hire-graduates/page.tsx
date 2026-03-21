import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import Link from 'next/link';
import Image from 'next/image';


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
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
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
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/pages/employers-page-1.jpg"
                  alt="Certified graduates ready for employment"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { image: '/images/pages/training-classroom.jpg', alt: 'Students in workforce training programs', title: 'Learn', desc: 'Short-term, industry-aligned training programs with hands-on instruction.' },
                { image: '/images/pages/credentials-page-1.jpg', alt: 'Industry certifications earned by graduates', title: 'Certify', desc: 'Graduates earn nationally recognized credentials before day one on the job.' },
                { image: '/images/pages/about-employer-partners.jpg', alt: 'Graduates placed with employer partners', title: 'Work', desc: 'We connect certified graduates directly with employers hiring in their field.' },
              ].map((card) => (
                <div key={card.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                    <Image src={card.image} alt={card.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* FAQ for Employers */}
      <section className="py-16 sm:py-20">
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
      <section className="py-16 sm:py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Ready to Hire Trained Talent?
          </h2>
          <p className="text-base md:text-lg text-slate-600 mb-8">
            Connect with job-ready graduates at no cost to your organization.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact?type=employer"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold transition-colors"
            >
              Request Candidates
            </Link>
            <Link
              href="/employer"
              className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Employer Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
