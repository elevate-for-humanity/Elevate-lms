import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const dynamic = 'force-static';
export const revalidate = 86400;
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Skilled Trades Training Programs | Free with WIOA | Indianapolis',
  description: 'HVAC, Electrical, Welding, Plumbing, CDL, and Diesel Mechanic training. Free for eligible participants. Hands-on training with job placement.',
  alternates: { canonical: `${SITE_URL}/programs/skilled-trades` },
  openGraph: {
    title: 'Skilled Trades Training Programs | Free with WIOA | Indianapolis',
    description: 'HVAC, Electrical, Welding, Plumbing, CDL, and Diesel Mechanic training. Free for eligible participants. Hands-on training with job placement.',
    url: `${SITE_URL}/programs/skilled-trades`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Skilled Trades Training Programs | Free with WIOA | Indianapolis' }],
    type: 'website',
  },
};

const programs = [
  { title: 'HVAC Technician', duration: '12 weeks', salary: '$52,000', href: '/programs/hvac-technician', image: '/images/pages/hvac-technician.jpg' },
  { title: 'Electrical Technician', duration: '12 weeks', salary: '$60,240', href: '/programs/electrical', image: '/images/pages/electrical-wiring.jpg' },
  { title: 'Welding Technician', duration: '10 weeks', salary: '$47,540', href: '/programs/welding', image: '/images/pages/welding-sparks.jpg' },
  { title: 'Plumbing Technician', duration: '10 weeks', salary: '$59,880', href: '/programs/plumbing', image: '/images/pages/programs-plumbing-apply-hero.jpg' },
  { title: 'CDL Class A Training', duration: '3–6 weeks', salary: '$62,000', href: '/programs/cdl-training', image: '/images/pages/comp-layout-hero.jpg' },
  { title: 'Diesel Mechanic', duration: '12 weeks', salary: '$55,000', href: '/programs/diesel-mechanic', image: '/images/pages/admin-fleet-hero.jpg' },
];

const config: ProgramPageConfig = {
  pageKey: 'skilled-trades',
  title: 'Skilled Trades', subtitle: 'HVAC, Electrical, Welding, Plumbing, CDL, and Diesel. Hands-on training with real job placement.',
  badge: 'Funding Available', badgeColor: 'orange',
  duration: '3–12 weeks', cost: '$0 with WIOA funding', format: 'Hybrid — Online + In-person, Indianapolis', credential: 'OSHA + Industry Certifications',
  overview: 'Our skilled trades programs prepare you for high-demand careers in construction, manufacturing, and transportation. Every program includes hands-on training with real tools and equipment, industry-recognized certifications, and job placement assistance. Most programs are free for eligible participants through WIOA funding.',
  highlights: ['Hands-on training from day one', 'OSHA safety certifications included', 'Industry-recognized credentials', 'Job placement with employer partners', 'Free for eligible participants through WIOA', 'Apprenticeship pathways available'],
  overviewImage: '/images/pages/skilled-trades-sector.jpg', overviewImageAlt: 'Skilled trades students in a workshop',
  salaryNumber: 55000, salaryLabel: 'Average starting salary across skilled trades programs', salaryPrefix: '$',
  credentials: ['OSHA 10/30-Hour', 'NCCER Core', 'EPA 608', 'AWS D1.1', 'CDL Class A'],
  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Register at Indiana Career Connect for WIOA eligibility.' },
    { title: 'Choose a Trade', desc: 'Pick the program that matches your career goals.' },
    { title: 'Start Training', desc: 'Begin hands-on training in your chosen trade.' },
  ],
  applyHref: '/apply?program=skilled-trades',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Skilled Trades' }],
};

export default function Page() {
  return (
    <ProgramPageLayout config={config}>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Choose Your Trade</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Skilled Trades Programs</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, i) => (
                <ScrollReveal key={p.title} delay={i * 80} direction="up">
                  <Link href={p.href} className="group block bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all overflow-hidden">
                    <Image src={p.image} alt={p.title} width={600} height={400} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{p.title}</span>
                        <span className="text-xs font-semibold text-brand-red-600 bg-brand-red-50 px-2 py-1 rounded-full">{p.duration}</span>
                      </div>
                      <span className="text-sm text-brand-green-600 font-semibold">{p.salary}/yr avg</span>
                      <div className="mt-3 text-brand-red-600 font-semibold text-sm group-hover:underline">Learn More →</div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </InView>
    </ProgramPageLayout>
  );
}
