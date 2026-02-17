import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Find Programs & Resources | Elevate For Humanity',
  description:
    'Search workforce training programs, career certifications, and funding options. Healthcare, skilled trades, CDL, technology, and barber apprenticeship programs in Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/search',
  },
  openGraph: {
    title: 'Find Programs & Resources | Elevate For Humanity',
    description:
      'Search workforce training programs, career certifications, and funding options at Elevate for Humanity.',
    url: 'https://www.elevateforhumanity.org/search',
    images: [
      {
        url: '/images/heroes/resources.jpg',
        width: 1200,
        height: 630,
        alt: 'Elevate for Humanity — Workforce Training Programs',
      },
    ],
  },
};

const programs = [
  {
    name: 'Healthcare',
    href: '/programs/healthcare',
    image: '/images/programs-hq/healthcare-hero.jpg',
    certs: ['CNA', 'Medical Assistant', 'Phlebotomy'],
    funding: 'WIOA & WRG eligible',
  },
  {
    name: 'Skilled Trades',
    href: '/programs/skilled-trades',
    image: '/images/programs-hq/skilled-trades-hero.jpg',
    certs: ['HVAC', 'Electrical', 'Welding', 'Plumbing'],
    funding: 'WIOA & JRI eligible',
  },
  {
    name: 'CDL Training',
    href: '/programs/cdl',
    image: '/images/gallery/image11.jpg',
    certs: ['Class A CDL', 'Class B CDL'],
    funding: 'WRG eligible',
  },
  {
    name: 'Barber Apprenticeship',
    href: '/programs/barber-apprenticeship',
    image: '/images/programs-hq/barber-hero.jpg',
    certs: ['Barber License'],
    funding: 'Earn while you learn — paid apprenticeship',
  },
  {
    name: 'Technology',
    href: '/programs/technology',
    image: '/images/programs-hq/technology-hero.jpg',
    certs: ['IT Support', 'Cybersecurity'],
    funding: 'WIOA eligible',
  },
  {
    name: 'CPR & First Aid',
    href: '/programs/cpr-first-aid-hsi',
    image: '/images/programs-hq/cna-training.jpg',
    certs: ['HSI CPR/AED', 'First Aid'],
    funding: 'Same-day certification',
  },
];

const quickLinks = [
  { label: 'Apply Now', href: '/apply/student', desc: 'Start your enrollment application' },
  { label: 'Funding & Eligibility', href: '/funding', desc: 'WIOA, WRG, and JRI funding options' },
  { label: 'Career Services', href: '/career-services', desc: 'Resume help, interview prep, job placement' },
  { label: 'Employer Partners', href: '/employer', desc: 'Hire trained, certified graduates' },
  { label: 'About Elevate', href: '/about', desc: 'Our mission, team, and programs' },
  { label: 'Contact Us', href: '/contact', desc: 'Talk to an enrollment advisor' },
];

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Search' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[320px] sm:h-[400px] overflow-hidden">
        <Image
          src="/images/heroes-hq/programs-hero.jpg"
          alt="Workforce training programs"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        
      </section>

      {/* Program Cards with Images */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Training Programs</h2>
          <p className="text-slate-600 mb-10">Industry-recognized certifications in high-demand fields. Many programs are free for eligible students.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog) => (
              <Link
                key={prog.name}
                href={prog.href}
                className="group rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={prog.image}
                    alt={prog.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {prog.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prog.certs.map((cert) => (
                      <span key={cert} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-brand-green-700 font-medium">{prog.funding}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-10 py-4 rounded-full transition hover:scale-105 shadow-lg"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Quick Links</h2>
          <p className="text-slate-600 mb-10">Common pages and resources.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition group"
              >
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{link.label}</h3>
                <p className="text-sm text-slate-500">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Banner */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[260px] sm:h-[320px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/cta-banner.jpg"
                alt="Workforce funding and financial aid"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-brand-green-700 font-bold text-sm mb-2 uppercase tracking-wide">Funding Available</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Many Programs Are Free</h2>
              <p className="text-slate-700 mb-3">
                WIOA, Workforce Ready Grant, and Job-Ready Incentive funding covers tuition, supplies, and certification fees for qualifying students.
              </p>
              <ul className="text-slate-700 space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-brand-green-600 font-bold mt-0.5">1.</span> Register at indianacareerconnect.com</li>
                <li className="flex items-start gap-2"><span className="text-brand-green-600 font-bold mt-0.5">2.</span> Schedule a WorkOne appointment</li>
                <li className="flex items-start gap-2"><span className="text-brand-green-600 font-bold mt-0.5">3.</span> Get approved and start training</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/funding"
                  className="inline-block bg-brand-green-600 hover:bg-brand-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Learn About Funding
                </Link>
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border-2 border-brand-green-600 text-brand-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-brand-green-50 transition"
                >
                  Register at ICC →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employer Section */}
      <section className="py-14 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <p className="text-brand-orange-600 font-bold text-sm mb-2 uppercase tracking-wide">For Employers</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Hire Trained Graduates</h2>
              <ul className="text-slate-700 space-y-3 mb-6">
                <li className="flex items-start gap-2"><span className="text-brand-orange-500 font-bold mt-0.5">•</span> Pre-trained, credentialed candidates ready to work</li>
                <li className="flex items-start gap-2"><span className="text-brand-orange-500 font-bold mt-0.5">•</span> WOTC tax credits — up to $9,600 per hire</li>
                <li className="flex items-start gap-2"><span className="text-brand-orange-500 font-bold mt-0.5">•</span> OJT reimbursement covers 50-75% of wages</li>
                <li className="flex items-start gap-2"><span className="text-brand-orange-500 font-bold mt-0.5">•</span> Post jobs and browse candidates online</li>
              </ul>
              <Link
                href="/employer"
                className="inline-block bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg"
              >
                Employer Portal →
              </Link>
            </div>
            <div className="relative h-[260px] sm:h-[320px] rounded-2xl overflow-hidden shadow-xl order-1 md:order-2">
              <Image
                src="/images/heroes/programs.jpg"
                alt="Employer partnerships"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-brand-red-600 to-brand-red-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Your New Career Today
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Apply in minutes. Most students begin training within 2-4 weeks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/apply/student"
              className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
