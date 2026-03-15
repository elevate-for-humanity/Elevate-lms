import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import { getActiveJobs, formatSalary, jobTypeLabel } from '@/lib/data/jobs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Careers - Join Our Team | Elevate For Humanity',
  description:
    'Join our mission to provide career training at no cost to eligible participants and workforce development. Explore career opportunities at Elevate For Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/careers',
  },
  openGraph: {
    title: 'Careers at Elevate for Humanity',
    description: 'Join our mission to provide career training at no cost to eligible participants and workforce development.',
    url: 'https://www.elevateforhumanity.org/careers',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Careers at Elevate' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers at Elevate for Humanity',
    description: 'Join our mission to provide career training at no cost to eligible participants.',
    images: ['/og-default.jpg'],
  },
};

// revalidate is set to 0 to ensure fresh data
export const revalidate = 0;

export default async function CareersPage() {
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
  
  const openPositions = await getActiveJobs({ limit: 20 });

  const benefits = [
    {
      image: '/images/pages/career-services-page-2.jpg',
      title: 'Competitive Salary',
      description: 'Fair compensation with performance bonuses and annual raises based on performance',
    },
    {
      image: '/images/pages/career-services-page-3.jpg',
      title: 'Health Benefits',
      description: 'Comprehensive health, dental, and vision coverage for you and your family',
    },
    {
      image: '/images/pages/career-services-page-4.jpg',
      title: 'Paid Time Off',
      description: 'Generous PTO and holiday schedule with work-life balance',
    },
    {
      image: '/images/pages/career-services-page-5.jpg',
      title: 'Professional Development',
      description: 'Continuous learning and growth opportunities with training stipends',
    },
    {
      image: '/images/pages/career-services-page-6.jpg',
      title: 'Remote Work',
      description: 'Flexible work arrangements with hybrid and fully remote options',
    },
    {
      image: '/images/pages/comp-highlights-team.jpg',
      title: 'Mission-Driven',
      description: "Make a real impact on people's lives through workforce development",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Careers' }]} />
        </div>
      </div>

      {/* Hero Banner */}
      <ModernLandingHero
        badge="Join Our Team"
        headline="Transform Lives Through"
        accentText="Workforce Development"
        subheadline="Help Us Provide Free Career Training to Thousands"
        description="At Elevate For Humanity, we believe everyone deserves access to quality career training and the opportunity to build a better future. Join our mission-driven team and make a real impact on people's lives through workforce development."
        imageSrc="/images/pages/apply-employer-hero.jpg"
        imageAlt="Join Our Team"
        primaryCTA={{ text: "View Open Positions", href: "#positions" }}
        secondaryCTA={{ text: "Learn About Our Culture", href: "#culture" }}
        features={[
          "Hundreds of Indiana residents trained • Strong placement outcomes",
          "Growing employer network • Mission-driven work",
          "Competitive benefits • Remote work options"
        ]}
        imageOnRight={true}
      />

      {/* Avatar Guide */}

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-black mb-8">
              At Elevate For Humanity, we believe everyone deserves access to
              quality career training and the opportunity to build a better
              future. We partner with workforce boards, employers, and community
              organizations to provide Free training for eligible participants that lead to
              real jobs.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">
                  20+
                </div>
                <div className="text-black">Training Programs</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">
                  50+
                </div>
                <div className="text-black">Employer Partners</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-blue-600 mb-2">
                  100%
                </div>
                <div className="text-black">Free with WIOA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="culture" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Work With Us
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white text-center p-8 rounded-lg border-2 border-gray-200 hover:border-brand-blue-500 hover:shadow-lg transition"
                >
                  <div className="relative w-full h-40 mb-4 overflow-hidden rounded-lg">
                    <Image
                      src={benefit.image}
                      alt={benefit.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-black">
                    {benefit.title}
                  </h3>
                  <p className="text-black leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Open Positions
            </h2>
            <div className="space-y-6">
              {openPositions.map((position) => (
                <div
                  key={position.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:border-brand-blue-500 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                      <p className="text-black mb-3">
                        {position.description || 'Join our team and make a difference in workforce development.'}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {position.remote_allowed && (
                          <span className="bg-brand-green-100 text-brand-green-700 px-3 py-2 rounded-full">Remote OK</span>
                        )}
                        {(position.job_type || position.employment_type) && (
                          <span className="bg-brand-blue-100 text-brand-blue-700 px-3 py-2 rounded-full">
                            {jobTypeLabel(position.job_type ?? position.employment_type)}
                          </span>
                        )}
                        {(position.salary_range || position.salary_min) && (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-full">
                            {formatSalary(position)}
                          </span>
                        )}
                        {position.location && (
                          <span className="bg-white text-slate-700 px-3 py-2 rounded-full">{position.location}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Link href={`/careers/jobs/${position.id}`} className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition">
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {openPositions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-black mb-4">No open positions at the moment.</p>
                <p className="text-black">Send us your resume and we will reach out when a matching role opens.</p>
                <Link href="/contact" className="mt-4 inline-block text-brand-blue-600 font-semibold hover:underline">Contact us →</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Our Hiring Process
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Apply Online</h3>
                  <p className="text-black">
                    Submit your application and resume through our online
                    portal.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Phone Screen</h3>
                  <p className="text-black">
                    Initial conversation with our HR team to discuss your
                    background and the role.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-white rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Team Interview</h3>
                  <p className="text-black">
                    Meet with the hiring manager and team members to discuss the
                    role in detail.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-white text-white rounded-full flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Offer</h3>
                  <p className="text-black">
                    Receive your offer and join our mission to transform lives!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Careers FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'What types of positions do you hire for?', a: 'We hire instructors, career coaches, enrollment specialists, administrative staff, and program coordinators. Positions vary based on current needs.' },
              { q: 'Do I need teaching experience to be an instructor?', a: 'Industry experience is most important. We provide training on instructional methods. Relevant certifications and work experience in your field are required.' },
              { q: 'Are positions full-time or part-time?', a: 'We offer both. Many instructor positions are part-time or contract-based. Administrative roles are typically full-time.' },
              { q: 'Can I work remotely?', a: 'Some administrative positions offer remote or hybrid options. Instructor and student-facing roles are typically on-site.' },
              { q: 'What benefits do you offer?', a: 'Full-time employees receive health insurance, paid time off, and professional development opportunities. Benefits vary by position type.' },
              { q: 'How do I apply?', a: 'Click on any open position to apply online. You can also send your resume to our contact form for general consideration.' },
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
      <section className="py-16 bg-white text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Don't See the Right Position?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              We're always looking for talented individuals who share our
              mission. Send us your resume and we'll keep you in mind for future
              opportunities.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-brand-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-white transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
